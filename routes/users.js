var express = require('express');
var router = express.Router();
const multer = require('multer');

const Event = require('../models/event');
const User = require('../models/user');

const sortByDate = require("../middlewares/common-functions").sortByDate
const isEventOver = require("../middlewares/common-functions").isEventOver
const updateUserOrganizedEventsArray = require("../middlewares/common-functions").updateUserOrganizedEventsArray

const bcryptSalt = 10;
const bcrypt = require('bcryptjs');

router.get("/dashboard", async function (req, res, next) {

  const userOrganizing = req.session.currentUser;
  const userData = await User.findById(userOrganizing._id).populate("organizedEvents").populate("participatedEvents")
  userData.organizedEvents = sortByDate(userData.organizedEvents, userData);
  userData.participatedEvents = sortByDate(userData.participatedEvents, userData);
  res.render("users/dashboard", {
    userData
  })
})


////////


var storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, callback) {
    callback(null, req.session.currentUser._id);
  }
});

router.post('/uploadphoto', async function (req, res) {
  var upload = multer({
    storage: storage
  }).single('photo');
  var postPictRoute = await User.findByIdAndUpdate(req.session.currentUser._id, {
    $set: {
      imgPath: `/uploads/${req.session.currentUser._id}`
    }
  }, {
    new: true
  }); //(req.session.currentUser._id, {$push: {imgPath: `./uploads/${req.session.currentUser._id}`}});
  //log//    console.log(`./public/uploads/${req.session.currentUser._id}`);
  //log//    console.log(req.session.currentUser._id);
  upload(req, res, function (err) {
    if (err) {
      return res.end("Error uploading file.");
    }
    res.redirect("back");
  });
});


// const upload = multer({ dest: './public/uploads/' });

// router.post('/uploadphoto', upload.single('photo'), (req, res) => {
//   const {name, filename, originalname} = req.body;
//   console.log('AQUI!!----> ' + name, filename, originalname);
//   console.log(req.body);
//   console.log(req.file);

//   res.redirect('dashboard');

// });

router.get("/dashboard/past", async function (req, res, next) {
  const userOrganizing = req.session.currentUser;
  const userData = await User.findById(userOrganizing._id).populate("pastOrganizedEvents").populate("pastParticipatedEvents")
  userData.pastpastOrganizedEvents = sortByDate(userData.pastOrganizedEvents, userData);
  userData.pastParticipatedEvents = sortByDate(userData.pastParticipatedEvents, userData);
  res.render("users/dashboard", {
    userData,
    pastEvents: true,
  })
})


router.get('/add-event', function (req, res, next) {
  res.render('users/add-event', {
    title: 'Palcony'
  });
});

router.post('/add-event', async function (req, res, next) {
  const {
    name,
    description,
    date
  } = req.body
  const userOrganizing = req.session.currentUser;
  const checkDate = new Date(date)
  if (isEventOver(checkDate) === true) {

    res.render('users/add-event', {
      errorMessage: `Events can't happen in the past; please input a future date.`
    });
    return;
  }
  let newEvent
  Event.findOne({
    organizer: userOrganizing._id,
    date: date
  }, (err, existingEvent) => {
    if (err) {
      next(err);
      return;
    }
    if (existingEvent !== null) {

      res.render('users/add-event', {
        errorMessage: `You already have an event scheduled at that time.`
      });
      return;
    }
    newEvent = {
      name: name,
      description: description,
      date: date,
      organizer: userOrganizing._id,
      latitude: userOrganizing.latitude,
      longitude: userOrganizing.longitude
    }
    const theEvent = new Event(newEvent)
    //    console.log(theEvent)

    theEvent.save(async (err) => {
      if (err) {
        res.render('users/add-event', {
          errorMessage: 'Something went wrong. Try again later.'
        });
        //Adrián, si hay conflicto no te preocupes, he cambiado un return por el redirect
      } else {
        let newEventId = await Event.findOne(theEvent, (_err, eventInDb) => eventInDb)
        await updateUserOrganizedEventsArray(newEventId, userOrganizing)
        res.redirect(`/events/${newEventId.id}`);
      };
    });
  });
});

router.get("/edit-user/:id", async function (req, res, next) {
  user = await User.findById(req.params.id);
  res.render("users/edit-user", user)
})

router.post("/edit-user/:id", async function (req, res, next) {
  const {
    name,
    email,
    password,
    passwordRepeat,
    description,
    latitude,
    longitude
  } = req.body;
  if (name === '' || email === '' || password === '') {
    res.render('auth/signup', {
      errorMessage: 'Enter valid user details.'
    });
    return;
  }
  if (password !== passwordRepeat) {
    res.render('auth/signup', {
      errorMessage: 'Please enter the same password in both fields.'
    });
    return;
  }
  console.log("Updating user " + req.params.id)
  const salt = bcrypt.genSaltSync(bcryptSalt);
  const hashedPass = bcrypt.hashSync(password, salt);
  await User.findByIdAndUpdate(req.params.id, {
    name,
    email,
    password: hashedPass,
    description,
    latitude,
    longitude
  }, {
    new: true
  }).catch((error) => {
    console.log(error)
  })
  req.session.currentUser = await User.findById(req.params.id)
  //  console.log(req.session.currentUser)
  res.redirect("/users/dashboard")
})

module.exports = router;