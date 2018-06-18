"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Koa = require("koa");
const Router = require("koa-router");
const Koabody = require("koa-body");
const send = require("koa-send");
const fs = require("fs");
const limit = require("koa-better-ratelimit");
const app = new Koa();
const router = new Router();
let flavor;
function loadConfig() {
    try {
        flavor = JSON.parse(fs.readFileSync("./config.json", "utf-8"));
    }
    catch (e) {
        console.error("Can't read file ./config.json!");
        console.error(e.message);
        flavor = {
            sweet: 0,
            salty: 0,
            spicy: 0
        };
    }
}
router.get("/index.html", async (ctx, next) => {
    await send(ctx, ctx.path, { root: "./public" });
});
router.get("/:addr/:file", async (ctx, next) => {
    await send(ctx, ctx.path, { root: "./public" });
});
router.get("/", async (ctx, next) => {
    await send(ctx, "./public/index.html");
});
router.get("/result", async (ctx, next) => {
    ctx.body = JSON.stringify(flavor, null, 2);
});
router.post("/", async (ctx, next) => {
    console.log(`POST: ${JSON.stringify(ctx.request.query === {} ? ctx.request.query : ctx.request.body)}`);
    try {
        let element = (function () {
            if (typeof ctx.request.query.flavor === "undefined") {
                return ctx.request.body.flavor;
            }
            return ctx.request.query.flavor;
        })();
        loadConfig();
        if (/sweet/g.test(element))
            flavor["sweet"]++;
        if (/salty/g.test(element))
            flavor["salty"]++;
        if (/spicy/g.test(element))
            flavor["spicy"]++;
        ctx.response.status = 200;
        ctx.body = JSON.stringify({
            statistics: Object.assign({}, flavor),
            code: 200
        });
    }
    catch (e) {
        ctx.response.status = 400;
        ctx.body = JSON.stringify({
            message: e.message,
            code: 400
        }, null, 2);
    }
    finally {
        fs.writeFileSync("./config.json", JSON.stringify(flavor, null, 2), "utf-8");
    }
});
loadConfig();
app.use(limit({
    duration: 60000,
    max: 10,
    accessLimited: JSON.stringify({
        message: "429: Too Many Requests.",
        code: 429
    }, null, 2)
}));
app.use(Koabody());
app.use(router.routes()).listen(8080);
//# sourceMappingURL=index.js.map