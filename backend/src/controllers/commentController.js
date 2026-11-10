const prisma = require("../config/db");

// Threaded comment sederhana per report (revisi note antara Manager <-> Contributor)
async function listByReport(req, res) {
  const { reportId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { reportId }, include: { author: true }, orderBy: { createdAt: "asc" },
  });
  res.json(comments);
}

async function create(req, res) {
  const { reportId, body } = req.body;
  const comment = await prisma.comment.create({
    data: { reportId, body, authorId: req.user.sub },
    include: { author: true },
  });
  req.app.get("io").emit("comment_added", { reportId, comment });
  res.status(201).json(comment);
}

module.exports = { listByReport, create };
