var AWS = require('aws-sdk');

const DEFAULT_BOOKMARKS_DATA = {
	'bookmarks-list': [],
};

class BookmarksKeeper {
	constructor(s3config) {
		const { bucketName, bucketKey, accessKeyId, secretAccessKey } = s3config;

		if (typeof bucketName !== 'string' || typeof bucketKey !== 'string') {
			throw new Error('Missed or incorrect bucket credentials passed.');
		}
		this.bucketName = bucketName;
		this.bucketKey = bucketKey;

		if (typeof accessKeyId !== 'string' || typeof secretAccessKey !== 'string') {
			throw new Error('Missed or incorrect AWS credentials passed.');
		}
		this.s3 = new AWS.S3({
			accessKeyId,
			secretAccessKey,
		});
	}

	async getBookmarksData(userId) {
		if (typeof userId !== 'string') {
			throw new Error('No user ID was provided which is required.');
		}

		let bookmarksData;
		let bookmarksFileInput;
		try {
			bookmarksFileInput = await this.s3
				.getObject({ Bucket: this.bucketName, Key: `${userId}-${this.bucketKey}` })
				.promise();
		} catch (e) {
			console.error('Error occured during file fetch.', e.message);
			return null;
		}

		try {
			bookmarksData = JSON.parse(bookmarksFileInput.Body);
		} catch (e) {
			console.error('Cant parse Bookmarks JSON data.');
			return null;
		}

		return bookmarksData;
	}

	async getBookmarksList(userId) {
		if (typeof userId !== 'string') {
			throw new Error('No user ID was provided which is required.');
		}

		const bookmarksData = await this.getBookmarksData(userId);
		if (!bookmarksData) {
			return [];
		}
		const { 'bookmarks-list': bookmarksList = [] } = bookmarksData;

		return bookmarksList;
	}

	async addBookmarks(userId, bookmarksArr) {
		if (typeof userId !== 'string') {
			throw new Error('No user ID was provided which is required.');
		}

		if (!Array.isArray(bookmarksArr)) {
			console.error('Bookmarks should be an array.');
			return;
		}

		let bookmarksData = await this.getBookmarksData(userId);
		if (!bookmarksData) {
			bookmarksData = DEFAULT_BOOKMARKS_DATA;
		}

		const { 'bookmarks-list': currentBookmarksList = [] } = bookmarksData;

		const filteredAddingBookmarks = bookmarksArr.filter((bm) => {
			if (currentBookmarksList.includes(bm)) {
				console.warn(`Bookmark "${bm}" was not added as it already exists.`);
				return false;
			}
			return true;
		});

		const newBookmarksList = [...currentBookmarksList, ...filteredAddingBookmarks];
		const newBookmarksData = Object.assign({}, bookmarksData, { 'bookmarks-list': newBookmarksList });

		await this.s3
			.putObject({
				Body: JSON.stringify(newBookmarksData),
				Bucket: this.bucketName,
				Key: `${userId}-${this.bucketKey}`,
			})
			.promise();
	}

	async deleteBookmarks(userId, bookmarksArr) {
		if (typeof userId !== 'string') {
			throw new Error('No user ID was provided which is required.');
		}

		if (!Array.isArray(bookmarksArr)) {
			console.error('Bookmarks should be an array.');
			return;
		}

		let bookmarksData = await this.getBookmarksData(userId);
		if (!bookmarksData) {
			bookmarksData = DEFAULT_BOOKMARKS_DATA;
		}

		const { 'bookmarks-list': currentBookmarksList = [] } = bookmarksData;

		const filteredBookmarksList = currentBookmarksList.filter((bm) => {
			if (bookmarksArr.includes(bm)) {
				return false;
			}
			return true;
		});

		const newBookmarksData = Object.assign({}, bookmarksData, { 'bookmarks-list': filteredBookmarksList });

		await this.s3
			.putObject({
				Body: JSON.stringify(newBookmarksData),
				Bucket: this.bucketName,
				Key: `${userId}-${this.bucketKey}`,
			})
			.promise();
	}

	async clearBookmarks(userId) {
		if (typeof userId !== 'string') {
			throw new Error('No user ID was provided which is required.');
		}

		let bookmarksData = await this.getBookmarksData(userId);
		if (!bookmarksData) {
			console.error('No bookmarks available.');
			return;
		}

		const newBookmarksData = Object.assign({}, bookmarksData, { 'bookmarks-list': [] });

		await this.s3
			.putObject({
				Body: JSON.stringify(newBookmarksData),
				Bucket: this.bucketName,
				Key: `${userId}-${this.bucketKey}`,
			})
			.promise();
	}
}

module.exports.BookmarksKeeper = BookmarksKeeper;
