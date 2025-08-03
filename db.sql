-- Name DB: misvord

CREATE TABLE Users (
    ID INTEGER(10) PRIMARY KEY,
    Username VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    GoogleID VARCHAR(255),
    AvatarURL INTEGER(10),
    Status VARCHAR(255),
    ProfilePictureUrl VARCHAR(255),
    BannerProfile VARCHAR(255),
    SecurityQuestion VARCHAR(255),
    SecurityAnswer VARCHAR(255),
    Bio VARCHAR(255),
    DisplayName VARCHAR(255),
    Discriminator CHAR(4)
);

-- 2. Server table (referenced by Channel and ServerInvite)
CREATE TABLE Server (
    ID INTEGER(10) PRIMARY KEY,
    Name VARCHAR(255),
    IconServer VARCHAR(255),
    Description VARCHAR(255),
    InviteLink VARCHAR(255),
    BannerServer VARCHAR(255),
    IsPrivate TINYINT(1)
);

-- 3. Channel table (referenced by Message and ChatRoom)
CREATE TABLE Channel (
    ID INTEGER(10) PRIMARY KEY,
    ServerID INTEGER(10),
    Name VARCHAR(255),
    Type VARCHAR(255),
    FOREIGN KEY (ServerID) REFERENCES Server(ID)
);

-- 4. ServerInvite table
CREATE TABLE ServerInvite (
    ID INTEGER(10) PRIMARY KEY,
    ServerID INTEGER(10),
    InviterUserID INTEGER(10),
    InviteLink VARCHAR(255),
    ExpiresAt DATE,
    FOREIGN KEY (ServerID) REFERENCES Server(ID),
    FOREIGN KEY (InviterUserID) REFERENCES Users(ID)
);

-- 5. UserServerMemberships table (junction table for Users and Server)
CREATE TABLE UserServerMemberships (
    ID INTEGER(10) PRIMARY KEY,
    UserID INTEGER(10),
    ServerID INTEGER(10),
    Role VARCHAR(255),
    FOREIGN KEY (UserID) REFERENCES Users(ID),
    FOREIGN KEY (ServerID) REFERENCES Server(ID)
);

-- 6. ChatRoom table
CREATE TABLE ChatRoom (
    ID INTEGER(10) PRIMARY KEY,
    Type VARCHAR(255),
    Name VARCHAR(255),
    ImageUrl VARCHAR(255)
);

-- 7. ChatParticipants table
CREATE TABLE ChatParticipants (
    ID INTEGER(10) PRIMARY KEY,
    ChatRoomID INTEGER(10),
    UserID INTEGER(10),
    FOREIGN KEY (ChatRoomID) REFERENCES ChatRoom(ID),
    FOREIGN KEY (UserID) REFERENCES Users(ID)
);

-- 8. Message table (main message entity)
CREATE TABLE Message (
    ID INTEGER(10) PRIMARY KEY,
    UserID INTEGER(10),
    ReplyMessageID INTEGER(10),
    Content TEXT,
    SentAt DATE,
    EditedAt DATE,
    MessageType VARCHAR(255),
    AttachmentURL VARCHAR(255),
    FOREIGN KEY (UserID) REFERENCES Users(ID),
    FOREIGN KEY (ReplyMessageID) REFERENCES Message(ID)
);

-- 9. ChatRoomMessage table (junction for ChatRoom and Message)
CREATE TABLE ChatRoomMessage (
    ID INTEGER(10) PRIMARY KEY,
    RoomID INTEGER(10),
    MessageID INTEGER(10),
    FOREIGN KEY (RoomID) REFERENCES ChatRoom(ID),
    FOREIGN KEY (MessageID) REFERENCES Message(ID)
);

-- 10. ChannelMessage table (junction for Channel and Message)
CREATE TABLE ChannelMessage (
    ID INTEGER(10) PRIMARY KEY,
    ChannelID INTEGER(10),
    MessageID INTEGER(10),
    FOREIGN KEY (ChannelID) REFERENCES Channel(ID),
    FOREIGN KEY (MessageID) REFERENCES Message(ID)
);

-- 11. MessageReaction table
CREATE TABLE MessageReaction (
    ID INTEGER(10) PRIMARY KEY,
    MessageID INTEGER(10),
    UserID INTEGER(10),
    Emoji VARCHAR(255),
    FOREIGN KEY (MessageID) REFERENCES Message(ID),
    FOREIGN KEY (UserID) REFERENCES Users(ID)
);

-- 12. Nitro table
CREATE TABLE Nitro (
    ID INTEGER(10) PRIMARY KEY,
    UserID INTEGER(10),
    Code VARCHAR(255),
    FOREIGN KEY (UserID) REFERENCES Users(ID)
);

-- 13. FriendsList table (self-referencing Users table)
CREATE TABLE FriendsList (
    ID INTEGER(10) PRIMARY KEY,
    UserID1 INTEGER(10),
    UserID2 INTEGER(10),
    Status VARCHAR(255),
    FOREIGN KEY (UserID1) REFERENCES Users(ID),
    FOREIGN KEY (UserID2) REFERENCES Users(ID)
);

-- Add indexes for better performance on foreign key columns
CREATE INDEX idx_channel_serverid ON Channel(ServerID);
CREATE INDEX idx_serverinvite_serverid ON ServerInvite(ServerID);
CREATE INDEX idx_serverinvite_inviteruserid ON ServerInvite(InviterUserID);
CREATE INDEX idx_userservermemberships_userid ON UserServerMemberships(UserID);
CREATE INDEX idx_userservermemberships_serverid ON UserServerMemberships(ServerID);
CREATE INDEX idx_chatparticipants_chatroomid ON ChatParticipants(ChatRoomID);
CREATE INDEX idx_chatparticipants_userid ON ChatParticipants(UserID);
CREATE INDEX idx_message_userid ON Message(UserID);
CREATE INDEX idx_message_replymessageid ON Message(ReplyMessageID);
CREATE INDEX idx_chatroomMessage_roomid ON ChatRoomMessage(RoomID);
CREATE INDEX idx_chatroomMessage_messageid ON ChatRoomMessage(MessageID);
CREATE INDEX idx_channelmessage_channelid ON ChannelMessage(ChannelID);
CREATE INDEX idx_channelmessage_messageid ON ChannelMessage(MessageID);
CREATE INDEX idx_messagereaction_messageid ON MessageReaction(MessageID);
CREATE INDEX idx_messagereaction_userid ON MessageReaction(UserID);
CREATE INDEX idx_nitro_userid ON Nitro(UserID);
CREATE INDEX idx_friendslist_userid1 ON FriendsList(UserID1);
CREATE INDEX idx_friendslist_userid2 ON FriendsList(UserID2);