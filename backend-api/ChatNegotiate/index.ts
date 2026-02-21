export default async function (context, req, connectionInfo) {
    context.res.body = connectionInfo;
};