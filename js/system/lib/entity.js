define(['system/geo/vector2', 'system/geo/rect', 'system/core/mouse', 'game/config/screen', 'system/core/game'], function(Vector2, Rect, mouse, ScreenConfig, game) {
	
	/*const EntityType = {
		None: '',
		Image: '',
		Scene: '',
		Background: '',
	}*/

    function Entity(pos, size) {

		this.position = pos || Zero();
		this.size = size || Zero();
		this.rotation = 0;
		this.pivot = Zero(); // between 0,0 and 1,1
        this.scale = new Vector2(1, 1);

		this.entities = [];
		this.blocking = [];
		this.parent = null;
		this.visible = true;
		this.EntityType = "None";
	}

	Entity.prototype.setSize = function (w, h) {
		this.size.x = w;
		this.size.y = h;
	};

	Entity.prototype.inheritSize = function () {
		var origin = new Vector2(0, 0);
		var end = new Vector2(0, 0);

		for (var i = 0; i < this.entities.length; i++)
			if(this.entities[i].size) {
				var entity = this.entities[i];
				var p2 = entity.position.sum(entity.size);

				origin.x = Math.min(entity.position.x, origin.x);
				origin.y = Math.min(entity.position.y, origin.y);
				end.x = Math.max(p2.x, end.x);
				end.y = Math.max(p2.y, end.y);
			}

		this.size = end.sub(origin);
	};

	Entity.prototype.setPosition = function (x, y) {
		this.position.x = x;
		this.position.y = y;
	};

	Entity.prototype.setParent = function (p) {
		this.parent = p;
	};

	// scale to fullscreen with distortion / Verzerrung
	Entity.prototype.setToFullscreenDistort = function (p) {
		this.scale = new Vector2(ScreenConfig.w * game.scaleInternal.x / this.size.x, ScreenConfig.h * game.scaleInternal.y / this.size.y);
	};

	// setToFullscreen to CutOff
	Entity.prototype.setToFullscreenCutOff = function (p) {

		var scaleX = ScreenConfig.w * game.scaleInternal.x / this.size.x;
		var scaleY = ScreenConfig.h * game.scaleInternal.y / this.size.y;
		var max = Math.max(scaleX, scaleY);

		var imgWidth = this.size.x * max;
		var realWidth = ScreenConfig.w * game.scaleInternal.x;

		if(this.size.y * max > ScreenConfig.h * game.scaleInternal.y)
		{
			//console.log("more X than Y -> move top");
			var imgHeight = this.size.y * max;
			var realHeight = ScreenConfig.h * game.scaleInternal.y;
			var imgTop = (imgHeight - realHeight) / 2 / game.scale.y;
			this.position.y = -imgTop;
		}
		if(this.size.x * max > ScreenConfig.w * game.scaleInternal.x)
		{
			//console.log("more Y than X -> move left");
			var imgWidth = this.size.x * max;
			var realWidth = ScreenConfig.w * game.scaleInternal.x;
			var imgLeft = (imgWidth - realWidth) / 2 / game.scale.x;
			//this.position.x = -imgLeft;
			this.position.x = -imgLeft;
		}

		this.scale = new Vector2(max, max);

	};

	Entity.prototype.add = function (entity) {
		entity.setParent(this);
		this.entities.push(entity);
	};

	Entity.prototype.relativeMouse = function () {
		if (this.parent)
			return this.parent.relativeMouse().dif(this.position);
		else
			return mouse.dif(this.position);
	};

	Entity.prototype.getCenterPoint = function (entity) {
		return new Vector2(this.position.x + this.size.x / 2, this.position.y + this.size.y / 2);
	};

	Entity.prototype.block = function (entity) {
		this.blocking.push(entity);
	};

	Entity.prototype.remove = function (entity) {
		if( this.entities.indexOf(entity) > -1 ) arrayRemove(this.entities, entity);
		if( this.blocking.indexOf(entity) > -1 ) arrayRemove(this.blocking, entity);
	};

	Entity.prototype.dispatch = function (list, event, argurment) {
		for (var i = 0; i < list.length; i++)
			if (list[i][event])
				list[i][event](argurment);
	};

	Entity.prototype.dispatchReverse = function (list, event, argurment) {
		for (var i = list.length-1; i >= 0; i--)
			if (list[i][event])
				if(list[i][event](argurment))
					return true;
	};

	Entity.prototype.update = function (delta) {
		if (this.onUpdate)
			this.onUpdate(delta);

		if (this.blocking.length) {
			this.dispatch(this.blocking, 'update', delta);
		} else {
			this.dispatch(this.entities, 'update', delta);
		}
	};

	Entity.prototype.getArea = function () {
		if (this.size.x == 0 && this.size.y == 0)
			this.inheritSize();
		return new Rect(Zero(), new Vector2(this.size.x * this.scale.x, this.size.y * this.scale.y));
	};

	Entity.prototype.getRelativeArea = function () {
		return this.getArea().moved(this.position);
	};

	Entity.prototype.hover = function () {
		return this.getArea().inside(this.relativeMouse());
	};

	var isFirstLayer = function() {

	}

	Entity.prototype.draw = function (ctx) {
	    if (!this.visible)
	        return;
		ctx.save();
		ctx.translate(this.position.x | 0, this.position.y | 0);


		// 
		var x = (ScreenConfig.w - ScreenConfig.wViewport) / 2;
		var y = (ScreenConfig.h - ScreenConfig.hViewport) / 2;

		if(this.EntityType == "Scene" || this.EntityType == "Background") {

			var scaleX = game.scaleInternal.x;
			var scaleY = game.scaleInternal.y;

			var scale = Math.min(scaleX, scaleY);
			var addPosX = 0;
			var addPosY = 0;

			// get additional Position offset
			if(scaleY < scaleX) {
				addPosX = x + (ScreenConfig.wViewport * scaleX - (ScreenConfig.wViewport * scaleY)) / 2;
			} else {
				addPosY = y + (ScreenConfig.hViewport * scaleY - (ScreenConfig.hViewport * scaleX)) / 2;
			}
			game.offset.x = addPosX;
			game.offset.y = addPosY;

			if(this.EntityType == "Scene") {
				ctx.translate(addPosX, addPosY);
				ctx.scale(scale, scale);
			} else /*if(this.EntityType == "Background")*/ {
				ctx.scale(1 / scale, 1 / scale);
				ctx.translate(-addPosX, -addPosY);
			}
		}


		ctx.translate(this.size.x * this.pivot.x, this.size.y * this.pivot.y);
		ctx.translate(this.scale.x, this.scale.y);
		ctx.rotate(this.rotation * Math.PI / 180);
		ctx.translate(-this.size.x * this.pivot.x * this.scale.x, -this.size.y * this.pivot.y * this.scale.y );

		if (this.onDraw)
		    this.onDraw(ctx);

		this.dispatch(this.entities, 'draw', ctx);
		this.dispatch(this.blocking, 'draw', ctx);

		if (this.postDraw)
		    this.postDraw(ctx);

		ctx.restore();
	};

	// used for mouse set cursor pointer -> check if mouse if inside this object
	Entity.prototype.mouseInArea = function() {
		var posTmp = this.relativeMouse();
		return this.getArea().inside(posTmp);
	}

	Entity.prototype.click = function (pos) {
		pos = pos.dif(this.position);
		
		if (this.getArea().inside(pos) == false)
			return;
		if (this.onClick && this.onClick(pos))
			return true;

		if (this.blocking.length) {
			return this.dispatchReverse(this.blocking, 'click', pos);
		} else {
			return this.dispatchReverse(this.entities, 'click', pos);
		}
	};

	Entity.prototype.mousedown = function (pos) {
		pos = pos.dif(this.position);
		if (!this.getArea().inside(pos)) return;
		if (this.onMouseDown && this.onMouseDown(pos)) return true;

		if (this.blocking.length) {
			return this.dispatchReverse(this.blocking, 'mousedown', pos);
		} else {
			return this.dispatchReverse(this.entities, 'mousedown', pos);
		}
	};

	Entity.prototype.mouseup = function (pos) {
		pos = pos.dif(this.position);
		if (!this.getArea().inside(pos)) return;
		if (this.onMouseUp && this.onMouseUp(pos)) return true;

		if (this.blocking.length) {
			return this.dispatchReverse(this.blocking, 'mouseup', pos);
		} else {
			return this.dispatchReverse(this.entities, 'mouseup', pos);
		}
	};

	// obsolete -> better use setCenterX() and add()
	Entity.prototype.center = function (obj) {

		obj.position.x = this.size.x / 2 - obj.size.x / 2;

		this.add(obj);
	};

	Entity.prototype.setLeft = function (obj) {
		obj.position.x = 0;
	};
	
	Entity.prototype.setCenterX = function (obj) {
		obj.position.x = this.size.x / 2 - obj.size.x / 2;
	};

	Entity.prototype.setRight = function (obj) {
		obj.position.x = this.size.x - obj.size.x;
	};

	Entity.prototype.setTop = function (obj) {
		obj.position.y = 0;
	};

	Entity.prototype.setCenterY = function (obj) {
		obj.position.y = this.size.y / 2 - obj.size.y / 2;
	};

	Entity.prototype.setBottom = function (obj) {
		obj.position.y = this.size.y - obj.size.y;
	};

	return Entity;
});
