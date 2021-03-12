require('dotenv').config();

const TelegramBot = require('telebot');
const {
	botToken,
	botCommands: { BOOKMARKS_ADD, BOOKMARKS_LIST, BOOKMARKS_CLEAR, BOOKMARKS_DELETE },
	bucketConfig: { bucketName, bucketKey, accessKeyId, secretAccessKey },
} = require('./config');
const { convertArrayToMatrix } = require('./helpers');
const { BookmarksKeeper } = require('./bookmarks-keeper');

const bot = new TelegramBot({
	token: botToken,
});

const keeper = new BookmarksKeeper({
	bucketName,
	bucketKey,
	accessKeyId,
	secretAccessKey,
});

const updateKeyboard = async (username, id, replyMessage) => {
	const bookmarksList = await keeper.getBookmarksList(username);
	let bookmarksKeyboard;

	if (!Array.isArray(bookmarksList) || bookmarksList.length === 0) {
		bookmarksKeyboard = [['No bookmarks.']];
	} else {
		bookmarksKeyboard = convertArrayToMatrix(bookmarksList);
	}
	const keyBoardMarkup = bot.keyboard(bookmarksKeyboard, { resize: true });

	bot.sendMessage(id, replyMessage, { replyMarkup: keyBoardMarkup });
};

bot.on(BOOKMARKS_ADD, async (msg) => {
	const {
		from: { username, id },
		text,
	} = msg;
	const bookmarksStr = text.replace(`${BOOKMARKS_ADD} `, '');
  const bookmarksArr = bookmarksStr.split(',').map(bookmark => bookmark.trim());

	await keeper.addBookmarks(username, bookmarksArr);
	await updateKeyboard(username, id, `Bookmarks was successfully added. List of added: ${bookmarksArr.join(',')}.`);
});

bot.on(BOOKMARKS_CLEAR, async (msg) => {
	const {
		from: { username, id },
	} = msg;

	await keeper.clearBookmarks(username);
	await updateKeyboard(username, id, 'Bookmarks was successfully cleared.');
});

bot.on(BOOKMARKS_LIST, async (msg) => {
	const {
		message_id,
		from: { username, id },
	} = msg;

	const bookmarks = await keeper.getBookmarksList(username);

	return bot.sendMessage(id, `Your bookmarks: ${bookmarks.join(',')}.`, { replyToMessage: message_id });
});

bot.on(BOOKMARKS_DELETE, async (msg) => {
	const {
		from: { username, id },
		text,
	} = msg;

	const bookmarksStr = text.replace(`${BOOKMARKS_DELETE} `, '');
	const bookmarksArr = bookmarksStr.split(',');

	await keeper.deleteBookmarks(username, bookmarksArr);
	await updateKeyboard(
		username,
		id,
		`Bookmarks was successfully deleted. List of deleted: ${bookmarksArr.join(',')}.`
	);
});

bot.on('forward', async (msg) => {
	const {
		from: { username, id },
	} = msg;

	const bookmarksList = await keeper.getBookmarksList(username);

	if (!Array.isArray(bookmarksList) || bookmarksList.length === 0) {
		return bot.sendMessage(id, 'No bookmarks available. Your awesome post could not be saved.');
	} else {
		const bookmarkButtons = bookmarksList.map((bookmark) => bot.inlineButton(bookmark, { callback: bookmark }));
		bookmarksKeyboard = convertArrayToMatrix(bookmarkButtons);
	}

  const keyBoardMarkup = bot.inlineKeyboard(bookmarksKeyboard, { resize: true });

	return bot.sendMessage(id, 'Which bookmark should I use for that awsome post?', { replyMarkup: keyBoardMarkup });
});

bot.on('callbackQuery', (msg) => {
	const {
    from: { username, id },
    data
	} = msg;

	bot.sendMessage(id, `${data} was clicked`);
});

bot.start();
