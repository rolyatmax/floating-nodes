Nodes
=====

I've been experimenting with WebGL and writing raw GLSL shaders lately. This is
a little thing I wrote which manages to do all the animation calculations,
including the positions of all particles and edges and the computations required
to find distances and set colors, in the shaders. The only changing inputs to
the shaders from frame to frame during the animation loop are a timestamp and
mouse coordinates.

Recently rewritten with [regl](http://regl.party)!

![nodes](/img/img.png?raw=true "nodes")

-------------------

# Run it yourself:

    npm install
    npm start

------------------

See it in action here: [tbaldw.in/nodes](https://tbaldw.in/nodes) or check out
the code at [github.com/rolyatmax/floating-nodes](https://github.com/rolyatmax/floating-nodes).
