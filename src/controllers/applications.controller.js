import Application from "../models/Application.js";

export const getTutorApplications = async (req, res) => {
  try {
    const applications = await Application.find({ tutorEmail: req.user.email }).sort({ appliedAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body; 
    
    const application = await Application.findOneAndUpdate(
      { _id: req.params.id, tutorEmail: req.user.email },
      { status },
      { new: true }
    );

    if (!application) return res.status(404).json({ message: "Application not found or unauthorized" });
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentApplications = async (req, res) => {
  try {
    const applications = await Application.find({ studentEmail: req.user.email }).sort({ appliedAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createApplication = async (req, res) => {
  try {
    const { tuitionId, tuitionTitle, subject, monthlyFee, tutorEmail, studentPhone, preferredSchedule, studentNote } = req.body;
    
    const existing = await Application.findOne({ tuitionId, studentEmail: req.user.email });
    if (existing) return res.status(400).json({ message: "You have already applied for this tuition." });

    const application = new Application({
      tuitionId,
      tuitionTitle,
      subject,
      monthlyFee,
      tutorEmail,
      studentName: req.user.name || "Student", // Fallback
      studentEmail: req.user.email,
      studentPhone,
      preferredSchedule,
      studentNote,
    });

    await application.save();
    res.status(201).json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({
      _id: req.params.id,
      studentEmail: req.user.email,
      status: "pending",
    });

    if (!application) {
      return res.status(404).json({ message: "Application not found or cannot be deleted (must be pending)" });
    }
    
    res.json({ message: "Application cancelled successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};