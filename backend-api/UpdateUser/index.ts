import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import Profanity from "profanity-js";
import { UserWithSecurityAttrs, UserToTableEntity } from "@pwdgame/shared";
import { UserTableName, DefaultOperationOptions } from "../Settings";

const updateUser: AzureFunction = async (context: Context, req: HttpRequest) => {
    if (!isValidUser(req.body)) {
        context.res = {
            status: 400,
            body: "Invalid user object"
        };
        return;
    }

    const profanity = new Profanity('', { language: 'en-us' })
    if (profanity.isProfane(req.body.username)) {
        context.res = {
            status: 409,
            body: "Username contains banned words"
        };
        return;
    }

    const entity = UserToTableEntity(req.body);

    const tableClient = TableClient.fromConnectionString(
        process.env["StorageAccountConnectionString"], UserTableName);

    try {
        await tableClient.createTable(DefaultOperationOptions);
    } catch (err) {
        if (err.details?.odataError?.code !== "TableAlreadyExists") {
            throw err;
        }
    }

    await tableClient.upsertEntity(entity, "Merge", DefaultOperationOptions);

    context.res = {
        status: 204 // no content
    };
};

const isValidUser = (user: any): user is UserWithSecurityAttrs => {
    return user
        && typeof user.username === "string"
        && typeof user.passwordHash === "string"
        && (!user.avatarId || typeof user.avatarId === "string")
        && (user as {}).hasOwnProperty("securityAnswers");
}

export default updateUser;