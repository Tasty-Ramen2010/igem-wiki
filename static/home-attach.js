// Cartoon tube for the home page: an ink-outlined chain that turns with the scroll. CartoonTube(canvas, points, radius, color) -> { draw(rotY) } or null without WebGL.
(function () {
  window.CartoonTube = function (cv, pts, r, col) {
    var T = window.THREE, ren; if (!T) return null;
    try { ren = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return null; }
    ren.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    var v = pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }), c = new T.Vector3(); v.forEach(function (p) { c.add(p); }); c.multiplyScalar(1 / v.length);
    var R = 0; v.forEach(function (p) { p.sub(c); R = Math.max(R, p.length()); });
    var curve = new T.CatmullRomCurve3(v), g = new T.Group(), scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, 1, 500), W = 0, H = 0;
    g.add(new T.Mesh(new T.TubeGeometry(curve, v.length * 3, r, 8, false), new T.MeshBasicMaterial({ color: col })), new T.Mesh(new T.TubeGeometry(curve, v.length * 3, r + 0.35, 8, false), new T.MeshBasicMaterial({ color: 0x0b1226, side: T.BackSide })));
    scene.add(g);
    return { draw: function (rot) {
      var w = cv.clientWidth || 1, h = cv.clientHeight || 1; if (w !== W || h !== H) { W = w; H = h; ren.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
      cam.position.set(0, 0, (R + r) * 1.15 / Math.sin(Math.min(15 * Math.PI / 180, Math.atan(Math.tan(15 * Math.PI / 180) * cam.aspect)))); cam.lookAt(0, 0, 0);
      g.rotation.set(0.25, rot, 0); ren.render(scene, cam);
    } };
  };
})();
