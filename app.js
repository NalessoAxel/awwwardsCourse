require("dotenv").config();


const logger = require("morgan");
const express = require("express");
const errorHandler = require("errorhandler");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const find = require("lodash/find");

const app = express();
const path = require("path");
const port = process.env.PORT || 3000;

const Prismic = require("@prismicio/client");
const PrismicDOM = require("prismic-dom");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride());
app.use(errorHandler());
app.use(express.static(path.join(__dirname, "public")));

const initApi = (req) => {
  return Prismic.getApi(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCES_TOKEN,
    req: req,
  });
};

const handleLinkResolver = (doc) => {
  if (doc.type === "product") {
    return `detail/${doc.slug}`;
  }

  if (doc.type === "collections") {
    return "/collections";
  }

  if (doc.type === "about") {
    return "/about";
  }

  return "/";
};

//middleware

app.use((req, res, next) => {
  // res.locals.ctx = {
  //   endpoint: process.env.PRISMIC_ENDPOINT,
  //   linkResolver: handleLinkResolver,
  // };

  res.locals.Link = handleLinkResolver;

  // add PrismicDOM in locals to access them in templates.
  res.locals.PrismicDOM = PrismicDOM;

  res.locals.Numbers = (index) => {
    return index == 0
      ? "One"
      : index == 1
      ? "Two"
      : index == 2
      ? "Three"
      : index == 3
      ? "Four"
      : "";
  };

  next();
});

const handleRequest = async (api) => {
  const meta = await api.getSingle("meta");
  const navigation = await api.getSingle("navigation");
  const preloader = await api.getSingle("preloader");
  const home = await api.getSingle("home");

  return {
    meta,
    navigation,
    preloader,
    home,
  };
};

app.set("views", path.join(__dirname, "views"));

app.set("view engine", "pug");

app.get("/", async (req, res) => {
  const api = await initApi(req);
  const defaults = await handleRequest(api);
  const home = await api.getSingle("home");

  console.log("home:", home.data.collections);

  const { results: collections } = await api.query(
    //deconstruct
    Prismic.Predicates.at("document.type", "collection"),
    {
      fetchLinks: "product.image",
    }
  );

  console.log("collec:", collections);

  res.render("pages/home", {
    ...defaults,
    collections,
    home,
  });
});

app.get("/about", async (req, res) => {
  const api = await initApi(req);
  const defaults = await handleRequest(api);
  const about = await api.getSingle("about");

  res.render("pages/about", {
    ...defaults,
    about,
  });
});

app.get("/collections", async (req, res) => {
  // console.log("REQUEST");
  const api = await initApi(req);
  const defaults = await handleRequest(api);

  const { results: collections } = await api.query(
    //deconstruct
    Prismic.Predicates.at("document.type", "collection"),
    {
      fetchLinks: "product.image",
    }
  );

  collections.forEach((collection) => {
    console.log("results:", collection);
  });

  res.render("pages/collections", {
    ...defaults,
    collections,
  });
});

app.get("/detail/:uid", async (req, res) => {
  const api = await initApi(req);
  const defaults = await handleRequest(api);
  const product = await api.getByUID("product", req.params.uid, {
    fetchLinks: "collection.title",
  });

  // console.log(product.data);

  res.render("pages/detail", {
    ...defaults,
    product,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
}); 