const express = require("express");
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");
const { getUserByEmail, urlsForUser, generateRandomString } = require("./helpers");

const requireLogin = (req, res, next) => {
  if (!req.session.user_id) {
    const errorMessage = "You are not logged in. Please log in to shorten URLs";
    return res.status(403).send(`<p>${errorMessage}</p>`);
  }
  next();
};

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000, //24 hours
}));

//ejs
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// --------------- GET Route Handlers --------------------- //

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const userUrls = urlsForUser(userId, urlDatabase);
  
  if (!user) {
    const errorMessage = "You are not logged in. Please log in or register to view your URLs.";
    return res.status(401).send(`<p>${errorMessage}</p>`);
  }
  
  const templateVars = {
    user,
    urls: userUrls
  };
  res.render("urls_index", templateVars);
});

//presents urls_new.ejs form to user
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[req.session["user_id"]]
  };
  res.render("urls_new", templateVars);
});

//Handle POST req to create a new short URL
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const generatedShortURL = generateRandomString();
  const userId = req.session.user_id;

  urlDatabase[generatedShortURL] = { longURL, userID: userId };

  res.redirect(`/urls/${generatedShortURL}`);
});

app.get("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  
  if (!user) {
    const errorMessage = "You are not logged in. Please log in or register to view this URL.";
    return res.status(401).send(`<p>${errorMessage}</p>`);
  }

  const url = urlDatabase[req.params.id];

  if (!url) {
    const errorMessage = "This short URL does not exist.";
    return res.status(404).send(`<p>${errorMessage}</p>`);
  }

  if (url.userID !== user.id) {
    const errorMessage = "You do not have permission to view this URL.";
    return res.status(403).send(`<p>${errorMessage}</p>`);
  }

  const templateVars = {
    user,
    id: req.params.id,
    longURL: url.longURL
  };
  res.render("urls_show", templateVars);
});

// Edit URL endpoint
app.get("/urls/:id/edit", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    const errorMessage = "You are not logged in. Please log in or register to edit this URL.";
    return res.status(401).send(`<p>${errorMessage}</p>`);
  }

  const url = urlDatabase[req.params.id];

  if (!url) {
    const errorMessage = "This short URL does not exist.";
    return res.status(404).send(`<p>${errorMessage}</p>`);
  }

  if (url.userID !== userId) {
    const errorMessage = "You do not have permission to edit this URL.";
    return res.status(403).send(`<p>${errorMessage}</p>`);
  }

  const templateVars = {
    user,
    id: req.params.id,
    longURL: url.longURL
  };
  res.render("urls_edit", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b><body></html>\n");
});

//Redirect to correct long URL from short URL
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];
  
  if (url) {
    res.redirect(url.longURL);
  } else {
    res.status(404).send("Short URL not found");
  }
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
  const user = null;
  const templateVars = {
    user,
  };
  res.render("registration", templateVars);
}
});

app.get("/login", (req, res) => {
  const user = null;
  const templateVars = {
    user,
  };
  res.render("login", templateVars);
});

// --------------- POST Route Handlers --------------------- //

//Endpoint for login form submission
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  //look up user by email
  const user = getUserByEmail(email, users);

  //if user DNE or incorrect password
  if (!user || !bcrypt.compareSync(password, user.password)) {
    res.status(403).send("Invalid email or password");
    return;
  }

  req.session.user_id = user.id; //set session data
  //redirect to /urls
  res.redirect('/urls');
});

//Endpoint for logout form submission
app.post('/logout', (req, res) => {
  req.session = null; //Clear session data
  res.redirect('/login');
});

// Delete URL endpoint
app.post("/urls/:id/delete", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  if (!user) {
    const errorMessage = "You are not logged in. Please log in or register to delete this URL.";
    return res.status(401).send(`<p>${errorMessage}</p>`);
  }

  const url = urlDatabase[req.params.id];

  if (!url) {
    const errorMessage = "This short URL does not exist.";
    return res.status(404).send(`<p>${errorMessage}</p>`);
  }

  if (url.userID !== user.id) {
    const errorMessage = "You do not have permission to delete this URL.";
    return res.status(403).send(`<p>${errorMessage}</p>`);
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// POST route to update a URL resource
app.post("/update/:id", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const url = urlDatabase[req.params.id];

  if (!user) {
    const errorMessage = "You are not logged in. Please log in or register to update this URL.";
    return res.status(401).send(`<p>${errorMessage}</p>`);
  }

  if (!url) {
    const errorMessage = "This short URL does not exist.";
    return res.status(404).send(`<p>${errorMessage}</p>`);
  }

  if (url.userID !== userId) {
    const errorMessage = "You do not have permission to update this URL.";
    return res.status(403).send(`<p>${errorMessage}</p>`);
  }

  // Update the long URL with the new value from req.body
  url.longURL = req.body.updatedLongURL;

  res.redirect("/urls");
});


//Endpoint for registration form data
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // Check if email or password are empty
  if (!email || !password) {
    return res.status(400).send("Email and password cannot be empty.");
  }

  //To check if email already exists in user object
  if (getUserByEmail(email, users)) {
    return res.status(400).send("Email already exists, choose a different email.");
  }

  // Generate hashed password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // random user ID
  const userId = generateRandomString();

  //new user object
  const newUser = {
    id: userId,
    email,
    password: hashedPassword
  };

  //new user to users object
  users[userId] = newUser;

  req.session.user_id = userId;

  res.redirect("/urls");
});


// PORT Listener
app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});