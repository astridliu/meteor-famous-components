/*
 * Templates are always added to a compView, in turn is added to it's parent
 * compView or a context.  This allows us to handle situations where a
 * template is later removed (since nodes cannot ever be manually removed
 * from the render tree).
 * 
 * http://stackoverflow.com/questions/23087980/how-to-remove-nodes-from-the-ren
 */

CompView = function(component, options, noAdd) {
  this.component = component;
  if (noAdd)
    return;
  
  var parent = component;
  while ((parent=parent.parent) && !parent.famousView);
  parent = parent ? parent.famousView : { node: famousCmp.mainCtx };

  this.parent = parent;

  if (options) {
    if (options.size) {
      this.size = options.size;
    }
  }

  if (famousCmp.viewOptions[parent.view] &&
  		famousCmp.viewOptions[parent.view].add)
  	// views can explicitly handle how their children should be added
  	famousCmp.viewOptions[parent.view].add.call(parent, this);
  else if (parent.sequencer)
  	// if the node has a sequencer, add by pushing to the sequence array
    parent.sequencer.sequence.push(this);
  else if (!parent.node || (parent.node._object && parent.node._object.isDestroyed))
    // compView->compView.  long part above is temp hack for template rerender #2010
    parent.setNode(this);
  else
  	// default case, just use the add method
    parent.node.add(this);
}

CompView.prototype.render = function() {
  if (this.isDestroyed)
    return [];
  if (this.node)
    return this.node.render();
  console.log('render called before anything set');
  return [];
}

CompView.prototype.setNode = function(node) {
  // surface or modifier/view
  this.node = new famous.core.RenderNode(node);
  return this.node;
}

CompView.prototype.preventDestroy = function() {
	this.destroyPrevented = true;	
}

CompView.prototype.destroy = function() {
  this.isDestroyed = true;
  this.node = null;
  this.viewNode = null;
  this.modifier = null;
  if (this.parent && this.parent.sequencePurge)
    this.parent.sequencePurge();
}

CompView.prototype.sequencePurge = function() {
  if (!this.sequencer)
    return;

  var sequence = this.sequencer.sequence,
    length = sequence.length;

  for (var i=0; i < length; i++)
    if (sequence[i].isDestroyed) {
      sequence.splice(i--, 1);
      length--;
    }
}

/*
var moo = _.once(function(compView) {
  console.log('getSize called for', compView);
});
*/
CompView.prototype.getSize = function() {
//  moo(this);
  return this.size || this.node && this.node.getSize() || [true,true];
}
//CompView.prototype.add = function() {
//}


famousCmp.dataFromComponent = function(component) {
  while ((component=component.parent) && !component.famousView);
  return component ? component.famousView : undefined;
}

famousCmp.dataFromTemplate = function(tplInstance) {
  return this.dataFromComponent(tplInstance.__component__);
}

famousCmp.dataFromElement = function(el) {
  var comp = UI.DomRange.getContainingComponent(el);
  return this.dataFromComponent(comp);
}

// Leave as alias?  Deprecate?
famousCmp.dataFromCmp = famousCmp.dataFromComponent;
famousCmp.dataFromTpl = famousCmp.dataFromTemplate;
