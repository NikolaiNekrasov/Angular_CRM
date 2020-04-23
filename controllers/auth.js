const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const keys = require('../config/keys')
const errorHandler = require('../utils/errorHandler')

module.exports.login = async function(req, res) {
	const candidate = await User.findOne({email: req.body.email})

	if (candidate) {
		//Password check, user exists
		const passwordResult = bcrypt.compareSync(req.body.password, candidate.password)
		if (passwordResult) {
			//Token generation, passwords match
			const token = jwt.sign({
				email: candidate.email,
				userId: candidate._id
			}, keys.jwt, {expiresIn: 60*60})
			res.status(200).json({
				token: `Bearer ${token}`
			})
		} else {
			//Passwords did not match
			res.status(401).json({
				message: 'Passwords do not match'
			})
		}
	} else {
		//No user, error
		res.status(404).json({
			message: 'User with this email not found'
		})
	}

}

module.exports.register = async function(req, res) {

	const candidate = await User.findOne({email: req.body.email})

	if (candidate) {
		// User exists, error must be displayed
		res.status(409).json({
			message: 'This email has already been used. Try another'
		})
	} else {
		//Need to create a user
		const salt = bcrypt.genSaltSync(10)
		const password = req.body.password
		const user = new User({
			email: req.body.email,
			password: bcrypt.hashSync(password, salt)
		})

		try{
			await user.save()
			res.status(201).json(user)
		} catch(e) {
			// Handle error
			errorHandler(res, e)
		}

	}
}
