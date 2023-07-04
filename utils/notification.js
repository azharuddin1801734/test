const { Expo } = require("expo-server-sdk");

exports.sendNotification = async (to, title, body) => {
  const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  try {
    if (Expo.isExpoPushToken(to)) {
      const messageToSend = expo.chunkPushNotifications([
        {
          to: `${to}`,
          sound: "default",
          title: title,
          body: body,
          data: { withSome: "data" },
        },
      ]);
      const ticketChunk = await expo.sendPushNotificationsAsync(
        messageToSend[0]
      );
      console.log(ticketChunk);
      const receiptIdChunks = expo.chunkPushNotificationReceiptIds([
        ticketChunk.id,
      ]);
      const receipts = await expo.getPushNotificationReceiptsAsync(
        receiptIdChunks[0]
      );
      console.log(receipts);

      // The receipts specify whether Apple or Google successfully received the
      // notification and information about an error, if one occurred.
      // eslint-disable-next-line guard-for-in,no-restricted-syntax
      for (const receiptId in receipts) {
        const { status, message, details } = receipts[receiptId];
        // eslint-disable-next-line no-empty
        if (status === "ok") {
        } else if (status === "error") {
          console.error(
            `There was an error sending a notification: ${message}`
          );
          if (details && details.error) {
            // The error codes are listed in the Expo documentation:
            // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
            // You must handle the errors appropriately.
            console.error(`The error code is ${details.error}`);
          }
        }
      }
    } else {
      console.error(`Push token ${to} is not a valid Expo push token`);
    }
  } catch (error) {
    console.error(error);
  }
};
