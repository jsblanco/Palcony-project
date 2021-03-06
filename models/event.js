const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    organizer: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    latitude: String,
    longitude: String,
    imgName: String,
    imgPath: String,
    participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isItOver: {type: Boolean, default: false},
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        comments: String
      }
    ],
    reviews: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        score: Number,
        comments: String,
      }
    ]
  },
  {
    timestamps: true
  }
);

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;

