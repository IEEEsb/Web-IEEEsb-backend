var async = require("async"),
	mongoose = require('mongoose'),
	model = mongoose.model('DistributedLock'),
	Promise = require('bluebird');

module.exports = function (name, opts) {
	return new Lock(name, opts)
}

// the Lock object itself
function Lock(name, opts) {
	if (!name) {
		throw new Error("missing_name")
	}
	opts = opts || {}

	var self = this

	self.name = name
	self.timeAquired = null
	self.lockId = null
	self.timeout = opts.timeout || 60 * 1000 // default: 60 seconds
	self.pollInterval = opts.pollInterval || 500 // default: 500 ms
	self.probeMaxAttempts = (self.timeout / self.pollInterval) + 2 // (timeout / probe interaval) + 2
}

Lock.prototype.acquire = function (callback) {
	var self = this

	if (self.lockId) {
		return callback(new Error("lock_already_aquired"))
	}

	self.timeAquired = Date.now()

	// firstly, remove any locks if they have timed out
	var q1 = {
		name: self.name,
		expire: { $lt: self.timeAquired },
	}
	model.findOneAndRemove(q1, function (err) {
		if (err) return callback(err)

		// now, try and insert a new lock
		var doc = {
			name: self.name,
			expire: self.timeAquired + self.timeout,
			inserted: self.timeAquired
		}

		model.create(doc, function (err, lock) {
			if (err) {
				if (err.code === 11000) {
					// there is currently a valid lock in the datastore
					return callback(null, false)
				}
				// don't know what this error is
				return callback(err)
			}

			self.lockId = lock.id
			return callback(null, true)
		})
	})
}

Lock.prototype.pollAcquire = function () {
	var self = this;
	return new Promise((resolve, reject) => {
		var attempts = 0
		async.forever(function (next) {
			attempts++
			self.acquire(function (err, lockAquired) {
				if (err) return next(err)

				if (lockAquired) return next(new Error("lockAquired"))
				if (attempts >= self.probeMaxAttempts) return next(new Error("timeout"))
				return setTimeout(next, self.pollInterval)
			})
		}, function (err) {
			if (err && err.message === "lockAquired") return resolve(true)
			if (err && err.message === "timeout") return reject(new Error("timeout in pollAquire for lock name" + self.name))
			else if (err) return reject(err)
			// just a safety callback although this function can never be called without an error
			return reject(new Error("missing error in async.forever for name lock " + self.name))
		})
	});
}

Lock.prototype.release = function (callback) {
	var self = this
	callback = callback ? callback : function () { };

	if (!self.lockId) {
		return callback(new Error("releasing_not_aquired_lock"))
	}

	var now = Date.now()

	// remove this lock if it is still valid
	var q1 = {
		_id: self.lockId,
		expire: { $gt: now }
	}
	model.findOneAndRemove(q1, function (err, oldLock) {
		if (err) return callback(err)

		self.lockId = null
		self.timeAquired = null

		if (!oldLock) {
			// there was nothing to unlock
			return callback(null, true)
		}

		// unlocked correctly
		return callback(null, false)
	})
}