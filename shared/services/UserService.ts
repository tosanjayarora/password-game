import sha256 from 'crypto-js/sha256';
import { User, UserWithSecurityAttrs } from "../models/User";

export class UserService {

    constructor(private backendApiBaseUrl: string) { }

    public async createUser(user: User, password: string, securityAnswers: { [key: string]: string }) {
        if ((await this.retrieveUser(user.username)) !== null) {
            throw new Error("That username is already taken.");
        }
        Object.keys(securityAnswers).forEach(k => securityAnswers[k] = this.hashValue(securityAnswers[k]));
        const userWithPass: UserWithSecurityAttrs = {
            ...user,
            passwordHash: this.hashValue(password),
            securityAnswers: securityAnswers
        }
        await this.persistUser(userWithPass);
    }

    public async updateUser(username: string, newProperties: Partial<User>) {
        const existingUser = await this.retrieveUser(username);
        if (!existingUser) {
            throw new Error("Unable to locate existing user information.");
        }
        const user = {
            ...existingUser,
            ...newProperties
        };
        await this.persistUser(user);
    }

    public async loginUser(username: string, password: string) {
        const user = await this.retrieveUser(username);
        if (!user || user.passwordHash !== this.hashValue(password)) {
            throw new Error("Invalid username or password!")
        }
        return user as User
    }

    public async getSecurityQuestions(): Promise<{ [key: string]: string }> {
        return {
            "favColor": "What is your favorite color?",
            "favFood": "What is your favorite food?",
            "birthplace": "What city were you born in?"
        };
    }

    public async verifySecurityAnswer(username: string, questionKey: string, questionAnswer: string) {
        const user = await this.retrieveUser(username);
        return user?.securityAnswers
            && user.securityAnswers[questionKey]
            && user.securityAnswers[questionKey] === this.hashValue(questionAnswer);
    }

    public async resetPassword(username: string, questionKey: string, questionAnswer: string, newPassword: string) {
        if (!await this.verifySecurityAnswer(username, questionKey, questionAnswer)) {
            throw new Error("Incorrect security question answer.");
        }
        const user = await this.retrieveUser(username);
        user!.passwordHash = this.hashValue(newPassword);
        await this.persistUser(user!);
        return user! as User;
    }

    // Obviously, the current implementations of persistUser and storeUser aren't secure production-style code
    // The idea is just to build a simple demonstrate and not actually worry about that for now

    private async persistUser(user: UserWithSecurityAttrs) {
        const resp = await fetch(this.getApiUrl("updateUser"), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        let body: string;
        if (!resp.ok) {
            if (resp.status === 409 && (body = await resp.text())) {
                throw new Error(body);
            }
            throw new Error("Failure while persisting user to remote store.")
        }
    }

    private async retrieveUser(username: string) {
        const resp = await fetch(this.getApiUrl("getUser", { username }));
        if (!resp.ok) {
            let body: string;
            if (resp.status === 404) {
                return null;
            } else if (resp.status === 409 && (body = await resp.text())) {
                throw new Error(body);
            }
            else {
                throw new Error("Failure while getting user from remote store.");
            }
        }
        return (await resp.json()) as UserWithSecurityAttrs;
    }

    private hashValue(password: string) {
        return sha256(password).toString();
    }

    private getApiUrl(path: string, queryParams: { [param: string]: string } = {}) {
        path = path.startsWith('/') ? path.substring(1) : path;
        const params = new URLSearchParams();
        Object.keys(queryParams).forEach(p => params.set(p, queryParams[p]));
        return `${this.backendApiBaseUrl}api/${path}?${params.toString()}`;
    }
}