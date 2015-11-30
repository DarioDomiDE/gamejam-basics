function Button(pos, callback) {
	Entity.call(this);
	this.position = pos;
	this.onClick = callback;
}

Button.prototype = new Entity();

Button.create = function(pos, callback) {
	return new Button(pos, callback);
};

Button.prototype.text = function(text, font, w, h) {
	this.size.x = Math.max(w||0, this.size.x);
	this.size.y = Math.max(h||0, this.size.y);

	var self = this;
	var txt = new TextEntity(new V2(this.size.x/2, this.size.y/2), text, font);

	txt.hover = function() { return self.hover(); };
	this.setText = function(s) { txt.text = s };

	this.entities.push(txt);
	return this;
};

Button.prototype.img = function(src, scale) {
	var img = new ImageEntity(Zero(), src, scale);
	this.size.x = Math.max(img.size.x, this.size.x);
	this.size.y = Math.max(img.size.y, this.size.y);
	this.entities.push(img);
	return this;
};

Button.prototype.rect = function(w, h, color) {
	var self = this;
	var rect = new RectEntity(Zero(), new V2(w,h), color);

	rect.hover = function() { return self.hover(); };

	this.size.x = Math.max(w, this.size.x);
	this.size.y = Math.max(h, this.size.y);
	this.entities.push(rect);
	return this;
};