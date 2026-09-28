export const access="public";
export const methods=["GET"];
export default async function(req,res){
  res.json({ok:true,app:"Signal",version:"mvp-1"});
}
