export const access="public";
export const methods=["POST"];
export default async function(req,res){
  const {topic="",message=""}=req.body||{};
  const m=String(message).toLowerCase();
  let suggestion="Add a specific detail from your own experience, then give them an easy thread to pick up.";
  if(m.length<12)suggestion="This may be a conversational dead-end. Add one personal detail or a playful follow-up.";
  if(String(topic).toLowerCase().includes("music"))suggestion="Stay with the music thread — specificity usually creates a better opening than changing subjects.";
  res.json({suggestion,mode:"rule-based-mvp"});
}
