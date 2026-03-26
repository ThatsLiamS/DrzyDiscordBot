const { Collection } = require('discord.js');
const firebaseAdmin = require('firebase-admin');

firebaseAdmin.initializeApp({
	credential: firebaseAdmin.credential.cert(
		JSON.parse(process.env['Database']),
	),
});
const firestore = firebaseAdmin.firestore();

const cache = {
	guilds: new Collection(),
	users: new Collection(),
	system: new Collection(),
};

/**
 * @async @function getValue
 * @group Utility @subgroup Database
 * @summary Retrieve a document from the database or cache
 *
 * @param {String} collectionID - The name of the Firestore collection
 * @param {String} documentID - The ID of the document to retrieve
 *
 * @returns {Promise<Object|null>} The document data or null if not found
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const getValue = async (collectionID, documentID) => {
	const cacheData = cache[collectionID]?.get(documentID);
	if (cacheData) {
		return cacheData;
	}

	const doc = await firestore.collection(collectionID).doc(documentID).get();
	const firestoreData = doc.exists ? doc.data() : null;

	if (firestoreData) {
		cache[collectionID].set(documentID, firestoreData);
	}

	return firestoreData;
};

/**
 * @async @function setValue
 * @group Utility @subgroup Database
 * @summary Save or update a document in the database and cache
 *
 * @param {String} collectionID - The name of the Firestore collection
 * @param {String} documentID - The ID of the document to save
 * @param {Object} data - The data object to store
 *
 * @returns {Promise<boolean>} True if the operation was successful
 *
 * @author Liam Skinner <me@liamskinner.co.uk>
**/
const setValue = async (collectionID, documentID, data) => {
	try {
		cache[collectionID].set(documentID, data);

		await firestore.collection(collectionID).doc(documentID).set(data, { merge: true });
		return true;
	}
	catch (error) {
		console.error(`Database Error [Set]: ${error.message}`);
		return false;
	}
};

module.exports = {
	getValue,
	setValue,
};
