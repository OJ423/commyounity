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
  postNewCommunityAdmin,
  deleteCommunityAdmin,
  postBlockedUser,
  deleteBlockedUser,
  getBlockedUsers,
  getCommunityMembers,
  getCommunityAdmins,
  postCommunityAdminById,
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

// Get community Members
communitiesRouter.get("/members/:community_id", authMiddleware, getCommunityMembers)

// Community Admin Members
communitiesRouter.get("/owners/:community_id", authMiddleware, getCommunityAdmins)
communitiesRouter.post("/owners/new/byuserid", authMiddleware, postCommunityAdminById)
communitiesRouter.post("/owners/new/:community_id", authMiddleware, postNewCommunityAdmin)
communitiesRouter.delete("/owners/remove/:community_id/:removedAdminId", authMiddleware, deleteCommunityAdmin)
// Block/UnBlock Users
communitiesRouter.get("/members/blocked/:community_id", authMiddleware, getBlockedUsers)
communitiesRouter.post("/members/block/:community_id", authMiddleware, postBlockedUser)
communitiesRouter.delete("/members/unblock/:community_id/:blockedUserId", authMiddleware, deleteBlockedUser)


module.exports = communitiesRouter;
