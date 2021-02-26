const mongoose = require("mongoose");
const redis = require("redis");
const keys = require("../config/keys");
const client = redis.createClient(keys.redisUrl);
const util = require("util");
client.get = util.promisify(client.get);
client.set = util.promisify(client.set);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.exec = async function () {

	const key = JSON.stringify(Object.assign({}, this.getQuery(), {
		collection: this.mongooseCollection.name
	}));

	const cacheValue = await client.get(key)

	if (cacheValue) {
		const doc = JSON.parse(cacheValue)
		const data =  Array.isArray(doc) ? doc.map(d => {
			new this.model(d)
		}) : new this.model(doc)

		console.log("data............", data);
		return data;
	}
	const result = await exec.apply(this, arguments)
	await client.set(key, JSON.stringify(result))
	return result;	
}