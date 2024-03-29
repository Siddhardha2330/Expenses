const admin = require('firebase-admin');
const TelegramBot = require('node-telegram-bot-api');

const token = '7025038700:AAGtV472VME2Xc6hyYw8N1pJm28Q3iJXh3k';

const bot = new TelegramBot(token, { polling: true });

const serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

bot.on('message', function (mg) {
  const msg = mg.text;
  const newMsg = msg.split(" ");

  if (newMsg[0] === 'POST') {

    db.collection('expenses').add({
      itemName: newMsg[1],
      itemPrice: parseInt(newMsg[2]),
      time: admin.firestore.FieldValue.serverTimestamp(),
      userId: mg.from.id
    }).then(() => {
      bot.sendMessage(mg.chat.id, `Item "${newMsg[1]}" with price ${newMsg[2]} stored successfully.`);
    }).catch((error) => {
      console.error('Error adding item:', error);
      bot.sendMessage(mg.chat.id, 'An error occurred while storing the item.');
    });
  }


  else if (newMsg[0] === 'GET') {
    if (newMsg[1] === 'allitems') {

      db.collection('expenses').where('userId', '==', mg.from.id).get().then((docs) => {
        let items = '';
        docs.forEach((doc) => {
          const data = doc.data();
          items += `${data.itemName}: ${data.itemPrice}\n`;
        });
        bot.sendMessage(mg.chat.id, items || 'No items found.');
      }).catch((error) => {
        console.error('Error retrieving items:', error);
        bot.sendMessage(mg.chat.id, 'An error occurred while retrieving items.');
      });
    }
    else if (newMsg[1] === 'totalexpenses') {
      
      db.collection('expenses').where('userId', '==', mg.from.id).get().then((docs) => {
        let total = 0;
        docs.forEach((doc) => {
          total += doc.data().itemPrice;
        });
        bot.sendMessage(mg.chat.id, `Total expenses: ${total}`);
      }).catch((error) => {
        console.error('Error calculating total expenses:', error);
        bot.sendMessage(mg.chat.id, 'An error occurred while calculating total expenses.');
      });
    } else {
      bot.sendMessage(mg.chat.id, 'Invalid command. Please use "GET allitems" or "GET totalexpenses".');
    }
  } else {
    bot.sendMessage(mg.chat.id, 'Invalid command. Please use "POST item_name price" or "GET allitems" or "GET totalexpenses".');
  }
});
