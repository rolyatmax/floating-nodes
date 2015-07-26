class Particle {
    constructor([x, y], inertia) {
        this.pos = [x, y];
        this.inertia = inertia;
    }

    update() {
        this.pos = this.pos.map((coord, i) => {
            return Math.max(Math.min(coord + this.inertia[i], 1), -1);
        });
        this.pos.forEach((coord, i) => {
            if (coord >= 1 || coord <= -1) {
                this.inertia[i] *= -1;
            }
        });
        return this.pos.slice();
    }
}

export default Particle;
