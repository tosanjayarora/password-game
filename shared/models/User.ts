import { TableEntity } from "@azure/data-tables";

export interface User {
    username: string;
    avatarId?: string;
}

export interface UserWithSecurityAttrs extends User {
    passwordHash: string,
    securityAnswers: { [key: string]: string };
}

export interface UserAsTableEntity extends TableEntity<Omit<UserWithSecurityAttrs, "securityAnswers">> {
    securityAnswers: string
}

export function UserToTableEntity(user: UserWithSecurityAttrs): UserAsTableEntity {
    return {
        ...user,
        securityAnswers: JSON.stringify(user.securityAnswers),
        partitionKey: user.username,
        rowKey: user.username
    };
}

export function UserFromTableEntity(user: UserAsTableEntity): UserWithSecurityAttrs {
    return {
        username: user.username,
        avatarId: user.avatarId,
        passwordHash: user.passwordHash,
        securityAnswers: JSON.parse(user.securityAnswers)
    }
}