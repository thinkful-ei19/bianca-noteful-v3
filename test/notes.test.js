'use strict';
const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const {Note} = require('../models/note');
const seedNotes = require('../db/seed/notes');

const expect = chai.expect;

//chai.use(chaiHttp);

describe('Noteful API - Notes', function() {
      before(function () {
        return mongoose.connect(TEST_MONGODB_URI);
      });
    
      beforeEach(function () {
        return Note.insertMany(seedNotes)
          .then(() => Note.createIndexes());
      });
    
      afterEach(function () {
        return mongoose.connection.db.dropDatabase();
      });
    
      after(function () {
        return mongoose.disconnect();
      });

    describe('GET /api/notes', function () {
        it('should return the correct number of Notes', function() {
            const dbPromise = Note.find();
            const apiPromise = chai.request(app).get('/api/notes');
            return Promise.all([dbPromise, apiPromise])
              .then(([data, res]) => {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.a('array');
                expect(res.body).to.have.length(data.length);

            });
        });
        

    });
    describe('GET /api/notes/:id', function () {
        it('should return the correct note', function() {
            let data;
            return Note.findOne().select('id title content')
              .then(_data => {
                  data = _data;
                  return chai.request(app).get(`/api/notes/${data.id}`);
              })
              .then((res) => {
                expect(res).to.have.status(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
                expect(res.body).to.have.keys('id', 'title', 'content', 'created');
                expect(res.body.id).to.equal(data.id);
                expect(res.body.title).to.equal(data.title);
                expect(res.body.content).to.equal(data.content);
              });
        });
        it('should respond with a 400 error', function() {
            const badId = '99-99-99';
            return chai.request(app)
              .get(`/api/notes/${badId}`)
              .catch(err => err.response)
              .then(res => {
                  expect(res).to.have.status(400);
                  expect(res.body.message).to.eq('The `id` is not valid');
              });
        });
        it('should respond with a 404 not found error', function() {
            return chai.request(app)
              .get(`/api/notes/AAAAAAAAAAAAAAAAAAAA`)
              .catch(err => err.response)
              .catch(res => {
                  expect(res).to.have.status(404);
              });
        });
    });

    
})