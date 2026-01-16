import * as THREE from 'three';

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // --- 1. Scene Setup ---
    const scene = new THREE.Scene();
    scene.environment = null; // We will generate a PMREM map if possible, but for intro use basic lights

    // Camera
    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 14); // Slightly further back for macro feel
    scene.add(camera);

    // Renderer (High Quality)
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        physicallyCorrectLights: true // Deprecated in newer three, use useLegacyLights = false
    });
    renderer.useLegacyLights = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // --- 2. Lighting & Environment (Key for PBR) ---
    // Environment Map (Simple Cube Map for sharpness)
    // For procedure we will simulate env map with lights for now as loading external HDR is complex without assets
    // actually, let's create a detailed lighting setup to fake it.

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Main Studio Light
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    // Rim Light (for edge highlights)
    const rimLight = new THREE.SpotLight(0xddeeff, 5.0);
    rimLight.position.set(-5, 5, -5);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    // Fill Light (Warmth for gums)
    const fillLight = new THREE.PointLight(0xffccaa, 1.0);
    fillLight.position.set(0, -5, 5);
    scene.add(fillLight);


    // --- 3. Advanced PBR Materials ---

    // TOOTH ENAMEL MATERIAL
    // Complex Physical Material to look wet and translucent
    const enamelMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xfffff0,        // Off-white
        roughness: 0.15,        // Smooth but natural micropores
        metalness: 0.0,
        transmission: 0.4,      // Subsurface scattering sim
        thickness: 1.5,         // Depth of light absorbtion
        clearcoat: 1.0,         // Saliva layer (wetness)
        clearcoatRoughness: 0.1,
        ior: 1.54,              // Refractive index of enamel
        sheen: 0.5,
        sheenColor: 0xffffff
    });

    // METAL MATERIAL (Brackets/Wire)
    const metalMaterial = new THREE.MeshStandardMaterial({
        color: 0xaaaaaa,
        roughness: 0.2,         // Brushed steel
        metalness: 1.0,         // Pure metal
    });

    // MOLDED/GUM MATERIAL (Base)
    const gumMaterial = new THREE.MeshSubsurfaceScatteringMaterial ?
        new THREE.MeshStandardMaterial({ color: 0xcc6666 }) : // Fallback
        new THREE.MeshPhysicalMaterial({
            color: 0xd96c7b,
            roughness: 0.4,
            metalness: 0.0,
            transmission: 0.2,
            thickness: 2.0,
            clearcoat: 0.3
        });


    // --- 4. High-Fidelity Geometry Generation ---

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    const brackets = [];

    // Helper to create a more organic tooth shape
    function createToothGeometry() {
        // Lathe or deformed box. Let's use a Box and round it heavily.
        const geo = new THREE.BoxGeometry(0.85, 1.4, 0.4, 4, 8, 4);

        // Deform geometry for organic look (taper bottom)
        const posAttribute = geo.attributes.position;
        const vertex = new THREE.Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);

            // Taper effect for root area (top/bottom)
            // Making it wider at top, narrower at bottom
            // Simple curvature
            const yNorm = (vertex.y + 0.7) / 1.4; // 0 to 1

            // Front curvature
            vertex.z += Math.cos(vertex.x * 2) * 0.15;

            // Rounding corners provided by segmentation + smooth shading
            // but let's pinch the bottom slightly
            if (vertex.y < -0.3) {
                vertex.x *= 0.8;
                vertex.z *= 0.8;
            }

            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        geo.computeVertexNormals();
        return geo;
    }

    const toothGeo = createToothGeometry();

    // Create detailed Bracket Geometry
    function createBracketGeometry() {
        const shape = new THREE.Shape();
        shape.moveTo(-0.15, -0.15);
        shape.lineTo(0.15, -0.15);
        shape.lineTo(0.15, 0.15);
        shape.lineTo(-0.15, 0.15);
        shape.lineTo(-0.15, -0.15);

        const extrudeSettings = {
            steps: 2,
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 3
        };

        const baseGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        // Add "wings" or slots
        // For performance, we'll stick to a high-detail base block with a groove
        return baseGeo;
    }

    const bracketGeo = createBracketGeometry();


    // Generate Arch
    const teethCount = 10;
    const archRadius = 4.5;

    for (let i = 0; i < teethCount; i++) {
        const t = i / (teethCount - 1);
        const angle = (t * Math.PI) - Math.PI / 2; // -90 to 90

        // Curve positions
        const x = Math.sin(angle) * archRadius;
        const z = Math.cos(angle) * archRadius - archRadius + 1.5;

        // Tooth Instance
        const tooth = new THREE.Mesh(toothGeo, enamelMaterial);
        tooth.position.set(x, 0, z);
        tooth.rotation.y = angle;
        tooth.castShadow = true;
        tooth.receiveShadow = true;

        // Random slight variations for realism
        tooth.position.y += (Math.random() - 0.5) * 0.1;
        tooth.rotation.z += (Math.random() - 0.5) * 0.05;

        // Container for tooth + bracket
        const unitGroup = new THREE.Group();
        unitGroup.add(tooth);
        modelGroup.add(unitGroup);

        // Bracket Instance
        const bracket = new THREE.Mesh(bracketGeo, metalMaterial);
        // Position on the front face of the tooth
        // Local offset relative to tooth center
        bracket.position.set(x, 0, z); // Initial same pos
        bracket.rotation.y = angle;

        // Push forward along local Z of rotation
        bracket.translateZ(0.55); // Move to surface

        modelGroup.add(bracket);
        brackets.push({ mesh: bracket, originalPos: bracket.position.clone(), originalRot: bracket.rotation.clone() });
    }

    // Archwire (Tube)
    class ArchCurve extends THREE.Curve {
        constructor(scale = 1) { super(); this.scale = scale; }
        getPoint(t) {
            const angle = (t * Math.PI) - Math.PI / 2;
            const x = Math.sin(angle) * (archRadius + 0.6); // Slightly outside teeth
            const z = (Math.cos(angle) * archRadius - archRadius + 1.5) + (Math.cos(angle) * 0.6);
            return new THREE.Vector3(x, 0, z);
        }
    }
    const wirePath = new ArchCurve();
    const wireGeo = new THREE.TubeGeometry(wirePath, 64, 0.04, 12, false); // Thinner, smoother
    const wire = new THREE.Mesh(wireGeo, metalMaterial);
    wire.castShadow = true;
    modelGroup.add(wire);


    // --- 5. Animation (Scroll "Explode") ---

    // Initial Pose
    modelGroup.rotation.x = 0.2;
    modelGroup.position.y = -0.5;

    const section = document.getElementById('braces-3d-section');

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "top center",
            end: "bottom bottom",
            scrub: 1.5
        }
    });

    // 1. Rotation (Examination View)
    tl.to(modelGroup.rotation, {
        y: Math.PI * 0.4,
        ease: "power1.out"
    }, 0);

    // 2. Explosion (Separation)
    // Move brackets strictly forward (Z) relative to camera or radially?
    // Let's move them radially outward.
    brackets.forEach((b, i) => {
        // Calculate outward vector based on rotation
        // Simple hack: move along local Z even further
        const targetZ = 1.0;

        // We need to animate position. Since they are in world space (grouped in modelGroup), 
        // we can translate them along their forward axis.

        // Use a proxy object or just manual update in tick? 
        // GSAP can animate checks.

        // Let's animate a "displacement" factor
        b.mesh.userData = { explode: 0 };

        tl.to(b.mesh.userData, {
            explode: 1.5, // Move 1.5 units out
            ease: "power2.inOut",
            onUpdate: () => {
                // Re-calculate position based on original + forward vector * explode
                const forward = new THREE.Vector3(0, 0, 1).applyEuler(b.originalRot);
                b.mesh.position.copy(b.originalPos).add(forward.multiplyScalar(b.mesh.userData.explode));
            }
        }, 0);
    });

    // Move Wire Forward
    tl.to(wire.position, {
        z: 2.0,
        y: 0.5, // Lift slightly
        ease: "power2.inOut"
    }, 0);


    // --- 6. Tick Loop ---

    // UI Annotations Refs
    const annotationBracket = document.getElementById('annotation-bracket');
    const annotationWire = document.getElementById('annotation-wire');

    // Show annotations mid-scroll
    tl.to([annotationBracket, annotationWire], { autoAlpha: 1, display: 'block' }, 0.5);

    function animate() {
        requestAnimationFrame(animate);

        // Gentle idle float
        modelGroup.position.y = -0.5 + Math.sin(Date.now() * 0.001) * 0.05;

        // Update Annotations
        if (brackets[4]) {
            updateAnnotation(brackets[4].mesh, annotationBracket);
        }
        if (wire) {
            // Center point of wire approx
            const wireCenter = new THREE.Vector3(0, 0, wire.position.z + 1.2);
            // Need to account for wire rotation if it was rotated, but it's child of group
            wireCenter.applyMatrix4(modelGroup.matrixWorld);
            updateAnnotationPosition(wireCenter, annotationWire);
        }

        renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // --- Helpers ---
    function updateAnnotation(mesh, element) {
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
});
