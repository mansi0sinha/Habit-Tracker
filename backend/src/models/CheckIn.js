import mongoose from "mongoose";
const checkInSchema = new mongoose.Schema(
    {
        habit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Habit",
            required: true
        },
        localDate: {
            type: String,
            required: true

        },
        checkedAt: {
            type: Date,
            required: true
        }
    }
);
checkInSchema.index({ habit: 1, localDate: 1 },
     {unique: true});
const CheckIn = mongoose.model("CheckIn", checkInSchema);
export default CheckIn;
