import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { UserAsTableEntity, UserFromTableEntity } from "@pwdgame/shared";
import { UserTableName, DefaultOperationOptions } from "../Settings";

const getUser: AzureFunction = async (context: Context, req: HttpRequest) => {
    const username = req.query.username as string | undefined;

    if (!username) {
        context.res = {
            status: 400,
            body: "Missing required query parameter: username"
        };
        return;
    }

    const tableClient = TableClient.fromConnectionString(
        process.env["StorageAccountConnectionString"], UserTableName);

    try {
        const userEntity = await tableClient.getEntity<UserAsTableEntity>(username, username, DefaultOperationOptions);
        context.res = {
            status: 200,
            body: UserFromTableEntity(userEntity)
        };
    } catch (err) {
        if (err.statusCode === 404) {
            context.res = {
                status: 404,
                body: "User not found"
            };
            return;
        }

        throw err;
    }
};

export default getUser;
