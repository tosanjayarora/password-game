export interface ChatMessage {
    username: string;
    avatarId?: string;
    message: string;
    messageId: string;
}

export interface ChatDeletionCommand {
    messageId: string;
}