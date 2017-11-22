
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });//渲染视图模板。
};