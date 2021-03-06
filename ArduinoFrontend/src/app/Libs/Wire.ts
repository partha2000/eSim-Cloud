import { Point } from './Point';

/**
 * To prevent window from throwing error
 */
declare let window;
/**
 * Class for Wire
 */
export class Wire {
  /**
   * Keyname require for mapping
   */
  keyName = 'wires';
  /**
   * Stores array of position [x,y]
   */
  points: number[][] = [];
  /**
   * Store the Raphael elements of the joints
   */
  joints: any[] = [];
  /**
   * End circuit node of wire
   */
  end: Point = null;
  /**
   * Body of the wire
   */
  element: any;
  /**
   * Color of the wire
   */
  color: any = '#000';
  /**
   * Store the glows on Hover
   */
  glows: any[] = [];
  /**
   * Id of the Wire
   */
  id: number;

  /**
   * Constructor of wire
   * @param canvas Raphael Canvas / paper
   * @param start Start circuit node of wire
   */
  constructor(public canvas, public start: Point) {
    this.id = Date.now(); // Generate New id

    // insert the position of start node in array
    this.points.push(start.position());
  }

  /**
   *  Draws wire on the canvas
   * @param x x position of point
   * @param y y position of point
   */
  draw(x: number, y: number) {
    // remove the wire
    if (this.element) {
      this.element.remove();
    }

    if (this.points.length > 1) {
      // Move to First point
      let inp = 'M' + this.points[0][0] + ',' + this.points[0][1] + ' ';
      // Draw lines to other points
      for (let i = 1; i < this.points.length; ++i) {
        inp += 'L' + this.points[i][0] + ',' + this.points[i][1] + ' ';
      }
      inp += x + ',' + y;
      // Update path
      this.element = this.canvas.path(inp);
    } else {
      // Draw a line
      this.element = this.canvas.path('M' + this.points[0][0] + ',' + this.points[0][1] + 'L' + x + ',' + y);
    }
  }

  /**
   * Add a point to wire
   * @param x x position
   * @param y y position
   */
  add(x: number, y: number) {
    this.points.push([x, y]);
  }
  /**
   * Handle click on Wire
   */
  handleClick() {
    // If Current Selected item is wire then deselect it
    if (window['Selected'] && (window['Selected'] instanceof Wire)) {
      window['Selected'].deselect();
    }

    // Show all joints
    for (const joint of this.joints) {
      joint.show();
    }

    // Select current instance
    window['isSelected'] = true;
    window['Selected'] = this;

    // Show properties
    window.showProperty(() => {
      return this.properties();
    });
  }

  /**
   * Set Color of the wire
   * @param color color of the wire
   */
  setColor(color: string) {
    this.color = color;
    this.element.attr({ stroke: color }); // set attribute
    // Update the color of joints
    for (const joint of this.joints) {
      joint.attr({ fill: color, stroke: color });
    }
  }

  /**
   * Return Properties of wire
   */
  properties() {
    // Create div and insert options form color
    const body = document.createElement('div');
    body.innerHTML = '<label>Color:</label><br>';
    const select = document.createElement('select');
    select.innerHTML = `<option>Black</option><option>Red</option><option>Yellow</option><option>Blue</option><option>Green</option>`;
    const colors = ['#000', '#ff0000', '#e6a800', '#2593fa', '#31c404'];
    // set the current color
    for (let i = 0; i < colors.length; ++i) {
      if (colors[i] === this.color) {
        select.selectedIndex = i;
      }
    }
    // set on change listener
    select.onchange = () => {
      // on change update the color
      this.setColor(colors[select.selectedIndex]);
    };

    body.append(select);
    return {
      title: 'Wire',
      keyName: this.keyName,
      id: this.id,
      body
    };
  }

  /**
   * Function to connect wire with the node
   * @param t End point / END circuit node
   * @param removeLast remove previously inserted item
   */
  connect(t: Point, removeLast: boolean = false, hideJoint: boolean = false) {
    // if remove last then pop from array
    if (removeLast && this.points.length > 1) {
      this.points.pop();
    }
    // change the end letiable
    this.end = t;
    // insert the end position
    this.points.push(t.position());

    if (this.points.length > 2) {
      // For each point in the wire except first and last
      for (let i = 1; i < this.points.length - 1; ++i) {
        // Create a Joint
        const joint = this.canvas.circle(this.points[i][0], this.points[i][1], 6);
        joint.attr({ fill: this.color, stroke: this.color });  // Give the joint a Color
        // Variables used while dragging joints
        let tmpx;
        let tmpy;
        // set drag listener
        joint.drag((dx, dy) => {
          // Update joints position
          joint.attr({ cx: tmpx + dx, cy: tmpy + dy });
          // Update repective Point
          this.points[i] = [tmpx + dx, tmpy + dy];
          // Update the wire
          this.update();
        }, () => {
          // Get the Joints center
          const xx = joint.attr();
          tmpx = xx.cx;
          tmpy = xx.cy;
        }, () => {
        });
        this.joints.push(joint);
        // Hide joint if required
        if (hideJoint) {
          joint.hide();
        }
      }
    }
    // Update Wire
    this.update();
  }
  /**
   * Returns true if both end of wire is connected
   */
  isConnected() {
    return (this.start !== null && this.end !== null);
  }
  /**
   * Update the wire position if the parent element is changed
   */
  update() {
    // check if both start and end node are present
    if (this.end && this.start) {
      // Update the start and ending position
      this.points[0] = this.start.position();
      this.points[this.points.length - 1] = this.end.position();
      // Remove from canvas
      if (this.element) {
        this.element.remove();
      }

      // Draw a Lines
      if (this.points.length > 2) {
        let inp = `M${this.points[0][0]},${this.points[0][1]}`;
        for (let i = 1; i < this.points.length; ++i) {
          if (i - 1 < this.joints.length) {
            this.joints[i - 1].toFront();
          }
          inp += ` L${this.points[i][0]},${this.points[i][1]}`;
        }
        this.element = this.canvas.path(inp);
      } else {
        // Draw a line
        this.element = this.canvas.path(`M${this.points[0][0]},${this.points[0][1]}L${this.points[1][0]},${this.points[1][1]}`);
      }
      // set click listener
      this.element.click(() => {
        this.handleClick();
      });
      // change attribute
      this.element.attr({ 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '4', stroke: this.color });
      if (this.glows.length > 0) {
        // this.glow.remove();
        this.removeGlows();
      }
      this.element.mouseover(() => {
        this.glows.push(
          this.element.glow({
            color: this.color
          })
        );

      });
      return true;
    }
    return false;
  }
  /**
   * Callback called after the wire is deselect
   */
  deselect() {
    for (const joint of this.joints) {
      joint.hide();
    }
  }
  /**
   * Return save object for the wire
   */
  save() {
    return {
      // object contains points,color,start point(id,keyname),end point(id,keybame)
      points: this.points,
      color: this.color,
      start: {
        id: this.start.parent.id,
        keyName: this.start.parent.keyName,
        pid: this.start.id
      },
      end: {
        id: this.end.parent.id,
        keyName: this.end.parent.keyName,
        pid: this.end.id
      }
    };
  }
  /**
   * Load data from saved object
   * @param data Saved object
   */
  load(data) {
    this.color = data.color;
    this.points = data.points;
  }
  /**
   * Remove Glow of Wire
   */
  private removeGlows() {
    while (this.glows.length !== 0) {
      this.glows.pop().remove();
    }
  }
  /**
   * Remove wire from canvas
   */
  remove() {
    // Remove Joint
    for (const joint of this.joints) {
      joint.remove();
    }
    // Remove Glow
    this.removeGlows();
    // Clear Joints
    this.joints = [];
    this.joints = null;
    // Clear Points
    this.points = [];
    this.points = null;
    // Remove element from dom
    this.element.remove();
    // Clear connection from start node
    if (this.start) {
      this.start.connectedTo = null;
    }
    // Clear connection from end node
    if (this.end) {
      this.end.connectedTo = null;
    }
    this.start = null;
    this.end = null;
    this.element = null;
  }
}
