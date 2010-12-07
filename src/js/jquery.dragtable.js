/*!
 * dragtable
 *
 * @Version 2.0
 *
 * Copyright (c) 2010, Andres Koetter akottr@gmail.com
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * Inspired by the the dragtable from Dan Vanderkam (danvk.org/dragtable/)
 * Thanks to the jquery and jqueryui comitters
 * 
 * Any comment, bug report, feature-request is welcome
 * Feel free to contact me.
 */

/*
 * Copyright (c) 2010, Jesse Baird <jebaird@gmail.com>
 * 12/2/2010
 * converted a jquery ui widget
 * 
 * depends on ui draggable
 * 
 * quick down and and dirty on how this works
 * so when a column is selected we grab all of the cells in that row and clone append them to a semi copy of the parent table and the 
 * "real" cells get a place holder class witch is removed when the dragstop event is triggered
 * 
 * TODO: 
 * add / create / edit css framework
 * add options
 * 		on drag start
 * 		drag
 * 		stop
 * 		
 * add getColOrder - return array 
 * 		setColOrder - reorder the table col accoring to the data suppided to this
 * 		use data attr to set this up
 * 
 * clean up the api - event driven like ui autocompleate
 * make it easy to have a button swap colums
 * 
 */
 
 /* TOKNOW:
 * For IE7 you need this css rule:
 * table {
 *   border-collapse: collapse;
 * }
 * Or take a clean reset.css (see http://meyerweb.com/eric/tools/css/reset/)
 */

(function($) {
  $.widget("jb.dragtable", {
  		//TODO: implement this
  		eventWidgetPrefix: 'dragtable',
  		
		options: {
			// when a col is dragged use this to find the symantic elements, for speed
			tableElemIndex:{  
				head: '0',
				body: '1',
				foot: '2'
			}
		},
				
		_create: function() {
			
			//console.log(this);
			//used start/end of drag
			this.startIndex = null;
			this.endIndex = null;
			this.currentColumnCollection = [];//the refferences to the table cells that are getting dragged
			
			//used on drag event to detect what direction the mouse is moving
			//init on drag start
			this.prevMouseX = 0;
			
			var self = this,
			o = self.options,
			el = self.element;
			
			
			
			el
			//TODO: right now you can drag driectly using the handler, you have to click first, fix this, i think you can do it using the mouse widget
			.find('thead th')
			.bind('mousedown',function(e){
				var $this = $(this),
				$dragDisplay = self.getCol($this.index());
				//console.log(dragDisplay)
				$dragDisplay
				.focus()
				.appendTo(document.body)
				
				.css({
					position:'absolute'
				})
				.position({
					of:this,
					my:'center bottom',
					at:'center bottom'
					
				})
				.draggable({
					
					handle: 'th',
					axis: 'x',
					containment: self.element,
					start: function(e,ui){
						self.prevMouseX = e.pageX;
						//TODO: trigger widget option here
						
					},
					drag: function(e, ui){
						console.log(e);
						//TODO: trigger widget option here
						//TODO: setup containment for the col in drag
						var columnPos = self._findElementPosition(self.currentColumnCollection[0]),
						half = self.currentColumnCollection[0].clientWidth / 2;
						//move left
						if(e.pageX < self.prevMouseX){
							var threshold = columnPos.x - half;
							if(ui.position.left < threshold){
								//console.info('move left');
								self.swapCol(self.startIndex-1);
								
							}

						}else{
							var threshold = columnPos.x + half;
							if(ui.position.left > threshold){
								//console.info('move right');
								self.swapCol(self.startIndex+1);
								
							}
						}
						//update mouse position
						self.prevMouseX = e.pageX;
						
				
					},
					stop: function(e, ui){
						//TODO: trigger widget option here
						self.dropCol($dragDisplay);
						self.prevMouseX = 0;
					}
				})
				
				
				
				//############
			});
                
		},
		
		_setOption: function(option, value) {
			$.Widget.prototype._setOption.apply( this, arguments );
           
		},
		
		/*
		 * get the selected index cell out of table row
		 * works dam fast
		 */
		_getCells: function( elem, index ){
			var ei = this.options.tableElemIndex,
			
			//TODO: clean up this format 
			tds = {
				'semantic':{
					'0': [],//head throws error if ei.head or ei['head']
					'1': [],//body
					'2': []//footer
				},
				'array':[]
			};
			
			//console.log(index);
			//check does this col exsist
			if(index <= -1 || typeof elem.rows[0].cells[index] == 'undefined'){
				return tds;
			}
			
			for(var i = 0, length = elem.rows.length; i < length; i++){
				var td = elem.rows[i].cells[index];

				tds.array.push(td);
				
				switch(td.parentNode.parentNode.nodeName){
					case 'THEAD':
					case 'thead':
						tds.semantic[ei.head].push(td);
						break;
					case 'TFOOT':
					case 'tfoot':
						tds.semantic[ei.foot].push(td);
						break;
					default:
						tds.semantic[ei.body].push(td);
						break;
				}
		 		
		 	}
		 	
		 	return tds;
		},
		/*
		 * return and array of children excluding text nodes
		 * used only on this.element
		 */
		_getChildren: function(){
			
			var children = this.element[0].childNodes,
			ret = [];
			for(var i = 0, length = children.length; i < length; i++){
				var e = children[i];
				if(e.nodeType == 1){
					ret.push(e);
				}
			}
			
			return ret;
		},
		
		_getElementAttributes: function(element){
			
        	var attrsString = '',
	        attrs = element.attributes;
	        for(var i=0, length = attrs.length; i < length; i++) {
	            attrsString += attrs[i].nodeName + '="' + attrs[i].nodeValue+'"';
	        }
	        return attrsString;
		},
		/*
		 * currently not uses
		 */
		_swapNodes: function(a, b) {
        	var aparent = a.parentNode,
        	asibling = a.nextSibling === b ? a : a.nextSibling;
        	b.parentNode.insertBefore(a, b);
        	aparent.insertBefore(b, asibling);
     	},
     	/*
     	 * faster than swap nodes
     	 * only works if a b parent are the same, works great for colums
     	 */
     	_swapCells: function(a, b) {
        	a.parentNode.insertBefore(b, a);
     	},
     	/*
     	 * use this instead of jquerys offset, in the cases were using is faster than creating a jquery collection
     	 */
		_findElementPosition: function( oElement ) {
			if( typeof( oElement.offsetParent ) != 'undefined' ) {
				for( var posX = 0, posY = 0; oElement; oElement = oElement.offsetParent ) {
					posX += oElement.offsetLeft;
					posY += oElement.offsetTop;
				}
				return {'x':posX, 'y':posY };
			} else {
				return {'x':oElement.x, 'y':oElement.y };
			}
		},
		
		/*
		 * build copy of table and attach the selected col to it, also removes the select col out of the table
		 * @returns copy of table with the selected col
		 */		
		getCol: function(index){
			//console.log('index of col '+index);
			//drag display is just simple html
			//console.profile('selectCol');
			
			//colHeader.addClass('ui-state-disabled')

			var $table = this.element,
			self = this,
			eIndex = self.options.tableElemIndex,
			//BUG: IE thinks that this table is disabled, dont know how that happend
			$dragDisplay = $('<table '+self._getElementAttributes($table[0])+'></table>')
			.addClass('dragtable-col-drag');
			
			//start and end are the same to start out with
			self.startIndex = self.endIndex = index;
		

		 	var cells = self._getCells($table[0], index);
			self.currentColumnCollection = cells.array;
			//console.log(cells);
			//################################
			
			//TODO: convert to for in // its faster than each
			$.each(cells.semantic,function(k,collection){
				//dont bother processing if there is nothing here
				
				if(collection.length == 0){
					return;
				}
				switch(k){
					case '0':
						
						var target = document.createElement('thead');
						$dragDisplay[0].appendChild(target);
						// 
						// var target = $('<thead '+self._getElementAttributes($table.children('thead')[0])+'></thead>')
						// .appendTo($dragDisplay);
						
						break;
					case '2':
						break;
					default:
						var target = document.createElement('tbody');
						$dragDisplay[0].appendChild(target);
						// var target = $('<tbody '+self._getElementAttributes($table.children('tbody')[0])+'></tbody>')
						// .appendTo($dragDisplay);
	
						break;
				}

				for(var i = 0,length = collection.length; i < length; i++){
					
					var clone = collection[i].cloneNode(true);
					collection[i].className+=' dragtable-col-placeholder';
					var tr = document.createElement('tr');
					tr.appendChild(clone);
					//console.log(tr);
					
					
					target.appendChild(tr);
					//collection[i]=;
				}
			});
		// console.log($dragDisplay);
		//console.profileEnd('selectCol')
		 return $dragDisplay;
		},
		
		
		
		/*
		 * move column left or right
		 */
		swapCol: function( to ){
			
			from = this.startIndex;
			this.endIndex = to;
			//console.log('to '+5)
	        if(from < to) {
	        	//move right
	        	for(var i = from; i < to; i++) {
	        		var row2 = this._getCells(this.element[0],i+1);
	        	//	console.log(row2)
	        		for(var j = 0, length = row2.array.length; j < length; j++){
	          			this._swapCells(this.currentColumnCollection[j],row2.array[j]);
	          		}
	          	}
	        } else {
	        	//move left
	        	for(var i = from; i > to; i--) {
	            	var row2 = this._getCells(this.element[0],i-1);
	            	for(var j = 0, length = row2.array.length; j < length; j++){
	          			this._swapCells(row2.array[j],this.currentColumnCollection[j]);
	          		}
	        	}
	        }
	        
	        this.startIndex = this.endIndex;
		},
		/*
		 * called when drag start is finished
		 */
		dropCol: function($dragDisplay){
		//	console.profile('dropCol');
			var self = this;
			
			if($dragDisplay){
				$dragDisplay.remove();
			}
			//remove placeholder class
			for(var i = 0, length = self.currentColumnCollection.length; i < length; i++){
				var td = self.currentColumnCollection[i];
				
				td.className = td.className.replace(' dragtable-col-placeholder','');
			}
			
			
			// $()
			// //this is way to slow
			// .removeClass('dragtable-col-placeholder');
			//console.profileEnd('dropCol');
		},
		
				
		destroy: function() {			

		}

        
	});

})(jQuery);