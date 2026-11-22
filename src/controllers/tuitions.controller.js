import Tuition from "../models/Tuition.js";

// Challenge 1 & Optional 1: Server-side search, filter, and pagination
export const getPublicTuitions = async (req, res) => {
  try {
    const { search, classLevel, mode, page = 1, limit = 8 } = req.query;
    
    // Base query: only approved and active
    const query = { approvalStatus: "approved", isActive: true };

    // Search by title or subject
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (classLevel && classLevel !== "All") query.classLevel = classLevel;
    if (mode && mode !== "All") query.mode = mode;

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const total = await Tuition.countDocuments(query);
    const tuitions = await Tuition.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      tuitions,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getFeaturedTuitions = async (req, res) => {
  try {
    const tuitions = await Tuition.find({ approvalStatus: "approved", isActive: true })
      .sort({ createdAt: -1 })
      .limit(6);
    res.json(tuitions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTuitionById = async (req, res) => {
  try {
    const tuition = await Tuition.findById(req.params.id);
    if (!tuition) return res.status(404).json({ message: "Tuition not found" });
    res.json(tuition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTuition = async (req, res) => {
  try {
    const { email, role, userId } = req.user;
    if (role !== "tutor") return res.status(403).json({ message: "Only tutors can post" });

    const User = (await import("../models/User.js")).default; // Import User model
    const user = await User.findById(userId);
    
    if (user.plan === "free") {
      const existingCount = await Tuition.countDocuments({ tutorEmail: email });
      if (existingCount >= 2) {
        return res.status(400).json({ message: "Free plan is limited to 2 tuition posts. Please upgrade to Pro." });
      }
    }

    const newTuition = new Tuition({
      ...req.body,
      tutorEmail: email,
      tutorName: req.body.tutorName || user.name,
      approvalStatus: "pending",
      isActive: true
    });

    await newTuition.save();
    res.status(201).json(newTuition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyTuitions = async (req, res) => {
  try {
    const tuitions = await Tuition.find({ tutorEmail: req.user.email }).sort({ createdAt: -1 });
    res.json(tuitions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTuition = async (req, res) => {
  try {
    const tuition = await Tuition.findOneAndUpdate(
      { _id: req.params.id, tutorEmail: req.user.email },
      req.body,
      { new: true }
    );
    if (!tuition) return res.status(404).json({ message: "Tuition not found or unauthorized" });
    res.json(tuition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTuition = async (req, res) => {
  try {
    const tuition = await Tuition.findOneAndDelete({ _id: req.params.id, tutorEmail: req.user.email });
    if (!tuition) return res.status(404).json({ message: "Tuition not found or unauthorized" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleTuitionStatus = async (req, res) => {
  try {
    const tuition = await Tuition.findOne({ _id: req.params.id, tutorEmail: req.user.email });
    if (!tuition) return res.status(404).json({ message: "Not found" });
    
    tuition.isActive = !tuition.isActive;
    await tuition.save();
    res.json(tuition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllAdminTuitions = async (req, res) => {
  try {
    const tuitions = await Tuition.find().sort({ createdAt: -1 });
    res.json(tuitions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateApprovalStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tuition = await Tuition.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: status },
      { new: true }
    );
    res.json(tuition);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};