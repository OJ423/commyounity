const communitiesRouter = require("express").Router();
const {
  getAllCommunities,
  getCommunityBusinesses,
  getCommunityGroups,
  getCommunitySchools,
  getCommunityChurches,
  postCommunity,
  patchCommunity,
  getCommunityById,
} = require("../controllers/communities.controller");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { authUserCrudOps } = require("../middlewares/authUserCrudOps");

communitiesRouter.get("/", getAllCommunities);
communitiesRouter.get("/:community_id", getCommunityById);
communitiesRouter.get("/:community_id/businesses", getCommunityBusinesses);
communitiesRouter.get("/:community_id/groups", getCommunityGroups);
communitiesRouter.get("/:community_id/schools", getCommunitySchools);
communitiesRouter.get("/:community_id/churches", getCommunityChurches);
communitiesRouter.patch("/edit/:community_id/:user_id", authMiddleware, authUserCrudOps, patchCommunity);
communitiesRouter.post("/", authMiddleware, authUserCrudOps, postCommunity);

module.exports = communitiesRouter;
