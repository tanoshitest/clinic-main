import * as THREE from 'three';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Scene, Camera, Renderer
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    const scene = new THREE.Scene();
    // Transparent background handled by renderer alpha: true

    // Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 12);
    scene.add(camera);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize for mobile
    container.appendChild(renderer.domElement);

    // Light setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 10);
    scene.add(dirLight);

    // 2. Procedural "Teeth & Braces" Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Materials
    const toothMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.2,
        metalness: 0.1
    });
    const bracketMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.4,
        metalness: 0.8
    });
    const wireMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.3,
        metalness: 0.9
    });

    const brackets = []; // store for animation

    // Generate Arc of Teeth
    const teethCount = 8;
    const radius = 4;

    for (let i = 0; i < teethCount; i++) {
        const angle = (i / (teethCount - 1)) * Math.PI - Math.PI / 2; // -90 to 90 degrees
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius - radius + 1; // minor curve adj

        // Tooth Mesh
        const toothGeo = new THREE.CapsuleGeometry(0.6, 1.2, 4, 8);
        const tooth = new THREE.Mesh(toothGeo, toothMaterial);
        tooth.position.set(x, 0, z);
        tooth.rotation.y = angle;
        modelGroup.add(tooth);

        // Bracket Mesh
        const bracketGeo = new THREE.BoxGeometry(0.3, 0.3, 0.2);
        const bracket = new THREE.Mesh(bracketGeo, bracketMaterial);

        // Initial position relative to tooth
        // We put it slightly in front
        const bracketGroup = new THREE.Group(); // Group to hold bracket for easier local transforms if needed
        bracket.position.set(0, 0, 0.6); // Offset from center of tooth

        // Align bracket group with tooth
        bracketGroup.position.set(x, 0, z);
        bracketGroup.rotation.y = angle;
        bracketGroup.add(bracket);

        modelGroup.add(bracketGroup);
        brackets.push(bracket); // Store the actual mesh
    }

    // Generate Wire (Simplified as a Torus segment or Tube)
    // For simplicity, we just make a curved tube that matches the arc
    class CustomCurve extends THREE.Curve {
        constructor(scale = 1) {
            super();
            this.scale = scale;
        }
        getPoint(t) {
            const angle = t * Math.PI - Math.PI / 2;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius - radius + 1;
            return new THREE.Vector3(x, 0, z + 0.7); // +0.7 to sit on brackets
        }
    }

    const path = new CustomCurve(1);
    const wireGeo = new THREE.TubeGeometry(path, 20, 0.05, 8, false);
    const wire = new THREE.Mesh(wireGeo, wireMaterial);
    modelGroup.add(wire);

    // 3. GSAP Animation
    // We animate the 'braces-3d-section' which is 200vh height
    // ScrollTrigger will pin the canvas-container or just use the scroll progress

    const section = document.getElementById('braces-3d-section');

    // Initial State
    modelGroup.rotation.x = 0.2;

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom bottom",
            scrub: 1, // smooth scrubbing
        }
    });

    // Rotate Model
    tl.to(modelGroup.rotation, {
        y: Math.PI * 0.5, // Rotate 90 degrees
        ease: "none"
    }, 0);

    // Explode Effect
    // Move brackets outward (locally Z)
    // Since brackets are children of rotated groups, we move them along Z axis of their parent
    brackets.forEach(bracket => {
        tl.to(bracket.position, {
            z: 1.5, // Move further out from tooth
            ease: "power1.inOut"
        }, 0);
    });

    // Move Wire outward
    // For the wire, straightforward Z shift might look okay, or scale it
    tl.to(wire.position, {
        z: 1,
        scale: 1.1, // Slight expansion
        ease: "power1.inOut"
    }, 0);

    // UI Annotations Logic
    // We want them to appear at specific progress points or just track positions
    const annotationBracket = document.getElementById('annotation-bracket');
    const annotationWire = document.getElementById('annotation-wire');

    // Show annotations halfway
    tl.to([annotationBracket, annotationWire], {
        autoAlpha: 1,
        display: 'block',
        duration: 0.1
    }, 0.5); // Start at 50% scroll

    // 4. Render Loop
    function animate() {
        requestAnimationFrame(animate);

        // Update Annotation Positions
        // Pick a bracket (e.g., index 3)
        if (brackets[3]) {
            updateAnnotation(brackets[3], annotationBracket);
        }
        // Wire approximate center
        if (wire) {
            // Just use specific point on wire (e.g. center)
            // Wire is at 0,0,0 local, but verify world pos
            const centerWireVec = new THREE.Vector3(0, 0, 0.7 + wire.position.z); // approximate based on geometry construction
            centerWireVec.applyMatrix4(modelGroup.matrixWorld);
            updateAnnotationPosition(centerWireVec, annotationWire);
        }

        renderer.render(scene, camera);
    }
    animate();

    // Helper: Project 3D to 2D
    function updateAnnotation(mesh, element) {
        // Get world position
        const vector = new THREE.Vector3();
        mesh.getWorldPosition(vector);
        updateAnnotationPosition(vector, element);
    }

    function updateAnnotationPosition(vector, element) {
        vector.project(camera);

        const x = (vector.x * 0.5 + 0.5) * container.clientWidth;
        const y = (-(vector.y * 0.5) + 0.5) * container.clientHeight;

        element.style.transform = `translate(${x}px, ${y}px)`;
    }

    // 5. Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
});
