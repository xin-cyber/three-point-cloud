import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const control = new OrbitControls(
    camera,
    renderer.domElement,
);

const particleNums = 15000; // 采样点的数量
const vertices = []; // 存储采样点的坐标
let sampler = null; // 采样器
let previousPoint; // 上一个采样点的坐标
let lineIndex = 0; // 记录当前绘制的线条数量
let angle = 0; // 相机旋转角度

// 添加模型
function addModel() {
    new OBJLoader().load(
        '/models/Elephant.obj',
        (obj) => {
            const model = obj.children[0];
            model.material = new THREE.MeshBasicMaterial({
                wireframe: true,
                color: new THREE.Color('#7264B5'),
                transparent: true,
                opacity: 5,
            });
            sampler = new MeshSurfaceSampler(model).build();

            const tempPosition = new THREE.Vector3();
            // 采样点坐标存储
            for (let i = 0; i < particleNums; i++) {
                sampler.sample(tempPosition);
                vertices.push(tempPosition.x, tempPosition.y, tempPosition.z);
            }
            addParticle(vertices);
        }
    );
}

// 点云绘制
function addParticle(vertices) {
    let colors = [];
    const palette = [
        new THREE.Color('#88C9B9'), // 青绿色
        new THREE.Color('#673AB7'), // 深紫色
        new THREE.Color('#009688'), // 深绿色
        new THREE.Color('#9C27B0'), // 深紫色
        new THREE.Color('#FFC107'), // 深橙色
        new THREE.Color('#03A9F4'), // 深蓝色
        new THREE.Color('#4CAF50'), // 深绿色
        new THREE.Color('#FF5722'), // 深橙色
    ];
    const pointGeometry = new THREE.BufferGeometry();
    console.log(pointGeometry);
    for (let i = 0; i < particleNums; i++) {
        const color = palette[Math.floor(Math.random() * palette.length)];
        colors.push(color.r, color.g, color.b);
    }
    pointGeometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3),
    );
    pointGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3),
    );
    const pointMaterial = new THREE.PointsMaterial({
        size: 0.1,
        alphaTest: 0.2,
        vertexColors: true,
    });
    const particles = new THREE.Points(pointGeometry, pointMaterial);
    scene.add(particles);
}

// 添加线条
function addLines() {
    if (sampler) {
        const tempPosition = new THREE.Vector3();
        const first = previousPoint ? previousPoint.clone() : new THREE.Vector3();
        const lineGeometry = new THREE.BufferGeometry();
        const lineMaterial = new THREE.LineBasicMaterial({
            color: new THREE.Color("#808080"),
            opacity: 0.5,
        });
        let line = new THREE.Line(lineGeometry, lineMaterial);
        !previousPoint && sampler.sample(first);
        previousPoint = first.clone();
        let pointFound = false;
        while (!pointFound) {
            sampler.sample(tempPosition);
            if (tempPosition.distanceTo(previousPoint) < 30) {
                lineGeometry.setAttribute(
                    'position',
                    new THREE.Float32BufferAttribute(
                        [
                            first.x, first.y, first.z,
                            tempPosition.x, tempPosition.y, tempPosition.z
                        ],
                        3,
                    ),
                );
                previousPoint = tempPosition.clone();
                pointFound = true;
            }
        }
        scene.add(line);
    }
}


function render() {
    if (lineIndex < particleNums) {
        addLines();
    }
    lineIndex++;
    const clock = new THREE.Clock();
    control.update(clock.getDelta());
    // 更新旋转角度
    angle += 0.0025; // 每帧增加的角度值
    camera.position.x = Math.cos(angle) * 200;
    camera.position.z = Math.sin(angle) * 200;
    camera.position.y = 120; // 固定Y轴位置
    // 使相机朝向场景中心
    camera.lookAt(scene.position);
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}


addModel();
render();