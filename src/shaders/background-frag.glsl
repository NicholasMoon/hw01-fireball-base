#version 300 es


precision highp float;
precision highp int;

uniform int u_Time;

uniform vec4 u_CamPos;
uniform mat4 u_CamViewMatrix;

uniform vec2 u_ScreenDims;

uniform vec4 u_Freq;
uniform vec4 u_NoiseFreq;
uniform vec4 u_NoiseAmp;
uniform vec4 u_NoisePersistence;
uniform vec4 u_NoiseOctaves;

in vec4 fs_Pos;
in vec2 fs_UV;

out vec4 out_Col;


const float PI = 3.14159f;	
const float GAMMA = 0.45454545454f;

/////////////////////////////////////////////////////////////////////////////////////////////////
// 3D Worley Noise implementation

vec3 random3D_to_3D_worley( vec3 input_vals ) {
    return fract(
		sin(
			vec3(
				dot(
					input_vals, vec3(194.38, 598.45, 638.345)
				),
                dot(
					input_vals, vec3(276.5, 921.53, 732.34)
				),
				dot(
					input_vals, vec3(129.63, 690.69, 403.35)
				)
			)
		) * 39483.3569
	);
}


float worley3D( vec3 p, float freq ) {
	// scale input by freq to increase size of grid
    p *= freq;

    vec3 p_floor = floor(p);
    vec3 p_fract = fract(p);
    float min_d = 1.0;

    // look for closest voronoi centroid point in 3x3x3 grid around current position
	for (int z = -1; z <= 1; ++z) {
		for	(int y = -1; y <= 1; ++y) {
			for	(int x = -1; x <= 1; ++x) {

				vec3 this_neighbor = vec3(float(x), float(y), float(z));

                // voronoi centroid
				vec3 neighbor_point = random3D_to_3D_worley(p_floor + this_neighbor);

				vec3 diff = this_neighbor + neighbor_point - p_fract;

				float d = length(diff);

				min_d = min(min_d, d);
			}
		}
	}
    
    return min_d;
}
/////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////
// Toolbox Function implementations

float bias(float t, float b) {
    return (t / ((((1.0/b) - 2.0)*(1.0 - t))+1.0));
}

float gain(float t, float g) {
    if (t < 0.5f) {
		return bias(1.0f - g, 2.0f * t) / 2.0f;
	}
	else {
		return 1.0 - bias(1.0f - g, 2.0 - 2.0 * t) / 2.0f;
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////
// Procedural Color implementations

// https://iquilezles.org/articles/palettes/
vec3 getCosinePaletteColor(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    return a + b * cos(2.0 * 3.1415927 * (c * t + d));
}


// function adds high frequency and low frequenct worley to create stars and galaxies
vec3 getStarryBackgroundColor(vec3 ray_d) {
    vec3 color = vec3(0,0,0);

    float noise_val_worley3D = 1.0 - worley3D( ray_d, 75.0 * u_NoiseFreq[3] );
    noise_val_worley3D = bias(noise_val_worley3D, 0.055f);
    noise_val_worley3D = gain(noise_val_worley3D, 0.815f);

    vec3 a = vec3(0.54,0.65,0.9);
    vec3 b = vec3(0.2,0.4,0.2);
    vec3 c = vec3(2.0,1.0,1.0);
    vec3 d = vec3(0.1,0.25,0.25);
    color += getCosinePaletteColor(a,b,c,d,sin(ray_d.x) + cos(ray_d.z));

    color *= noise_val_worley3D * 64.0;

    float noise_val_worley3D_mid = 1.0 - worley3D( ray_d, 20.0 * u_NoiseFreq[3] );
    noise_val_worley3D_mid = bias(noise_val_worley3D_mid, 0.055f);
    noise_val_worley3D_mid = gain(noise_val_worley3D_mid, 0.815f);

    a = vec3(0.5,0.15,0.5);
    b = vec3(0.25,0.25,0.5);
    c = vec3(.65,0.6,0.22);
    d = vec3(0.56,0.133,0.67);
    color += getCosinePaletteColor(a,b,c,d,sin(ray_d.x) + cos(ray_d.z));

    color *= noise_val_worley3D_mid * 64.0;

    float noise_val_worley3D_big = 1.0 - worley3D( ray_d,  5.0 * u_NoiseFreq[3] );
    noise_val_worley3D_big = bias(noise_val_worley3D_big, 0.055f);
    noise_val_worley3D_big = gain(noise_val_worley3D_big, 0.815f);

    a = vec3(0.15,0.5,0.5);
    b = vec3(0.5,0.5,0.25);
    c = vec3(0.22,0.75,0.45);
    d = vec3(0.0,0.33,0.167);
    color += getCosinePaletteColor(a,b,c,d,sin(ray_d.x) + cos(ray_d.z));

    color *= noise_val_worley3D_big * 2.0;

    return color;
}

/////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////
// Ray marching implementations

// Based on information from Adam's 561 "Ray-tracing" slides and ray casting from that class
vec3 rayCast(vec3 cam_right, vec3 cam_up, vec3 cam_forward) {
    float fov_term = tan((20.5f * PI / 180.0) * 0.5);
    float aspect_ratio = u_ScreenDims.x / u_ScreenDims.y;
    
    // converts [0,1] to [-1,1] (normalized device coordinates)
    vec2 norm_device_coords = (fs_UV * 2.0f) - vec2(1.f);

    vec3 ref = u_CamPos.xyz + cam_forward;
    vec3 V = cam_up * fov_term;
    vec3 H = cam_right * fov_term * aspect_ratio;
    vec3 p = ref + H * norm_device_coords.x + V * norm_device_coords.y;

    return normalize(p - u_CamPos.xyz);
}

/////////////////////////////////////////////////////////////////////////////////////////////////

void main()
{
    float myTime = float(u_Time) / (u_Freq[3] * 500.0);


    vec3 cam_right = normalize(vec3(u_CamViewMatrix[0][0], u_CamViewMatrix[0][1], u_CamViewMatrix[0][2]));
    vec3 cam_up = normalize(vec3(u_CamViewMatrix[1][0], u_CamViewMatrix[1][1], u_CamViewMatrix[1][2]));
    vec3 cam_forward = normalize(vec3(u_CamViewMatrix[2][0], u_CamViewMatrix[2][1], u_CamViewMatrix[2][2]));

    vec3 rayDirection = rayCast(cam_right, cam_up, cam_forward);
    
    vec3 color = vec3(0,0,0);
    
    rayDirection.x += myTime;
    rayDirection.z += myTime;
    color += getStarryBackgroundColor(rayDirection);

    out_Col = vec4(color, 1.0);
}