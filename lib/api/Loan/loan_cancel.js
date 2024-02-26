var express = require('express');
var router = express.Router();
var Model = require('../../../models/index');
var Response = require('../../Response');
const Sequelize = require("sequelize");
var statusCodes = require('../../statusCodes');
var { validateUserToken } = require("../../../middlewares/validateToken");
var { encryptResponse, } = require("../../../middlewares/crypt");
const moment = require("moment");


/**
 * Beneficiary approve route
 * This endpoint allows to view is_loan of any user
 * @path                             - /api/loan/loan
 * @middleware                       - Checks admin authorization
 * @return                           - Status
 */
router.post('/', validateUserToken, (req, res) => {
    var r = new Response();
    const default_loan_amount = 5000000;
    let account_number = req.body.selected_account;
    let username = req.body.username;
    Model.account.findOne({
        where: {
            account_number: account_number
        },
        attributes:["balance"]
    }).then((accountdata) => { 
        if (accountdata.balance >= 5000000) {
            Model.loan.findOne({
                where: {
                    username: username
                },
                attributes:["loan_time"]
            }).then((loanData) => {
                var loan_time = (loanData.dataValues.loan_time.getTime());
                var nowtime =((new Date).getTime());
                if (nowtime <= loan_time + 86400000) {
                Model.users.update({
                    is_loan: false
                }, {
                    where: {
                        username: username
                    }
                }).then(() => {

                    Model.account.update({
                        balance: Sequelize.literal(`balance - ${default_loan_amount}`)
                    }, {
                        where: {
                            account_number: account_number
                        }
                    }).then(() => {   

                    Model.loan.destroy({
                        where: {
                            username: username
                        }
                    }).then(() => { 

                        r.status = statusCodes.SUCCESS;
                        r.data = {
                            "message": "Success cancellation of loan"
                        };
                        return res.json(encryptResponse(r));
                    })
                })
            })
        } else {

            r.status = statusCodes.BAD_INPUT;
            r.data = {
                "message": "timeout"
            };
            return res.json(encryptResponse(r));
        }
        })
        } else {

            r.status = statusCodes.BAD_INPUT;
            r.data = {
                "message": "Insufficient balance"
            };
            return res.json(encryptResponse(r));
        }
        }).catch((err) => {

            r.status = statusCodes.SERVER_ERROR;
            r.data = {
                "message": "Choose an account"
            };
            return res.json(encryptResponse(r));
    });
})


module.exports = router;