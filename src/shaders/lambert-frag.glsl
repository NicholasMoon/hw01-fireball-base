#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;
precision highp int;

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform int u_Time;
uniform vec4 u_CubePos;

uniform vec4 u_Freq;
uniform vec4 u_NoiseFreq;
uniform vec4 u_NoiseAmp;
uniform vec4 u_NoisePersistence;
uniform vec4 u_NoiseOctaves;


uniform vec4 u_LightPos;
uniform vec4 u_LightCol;

uniform vec4 u_Roughness;
uniform vec4 u_Metallic;

uniform vec4 u_CamPos;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Pos;
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.
				  
				  
const float PI = 3.14159f;	
const float GAMMA = 0.45454545454f;	 


/////////////////////////////////////////////////////////////////////////////////////////////////
// 3D FBM implementation

float random3D_to_float_fbm( vec3 input_vals ) {
	return fract(sin(dot(input_vals, vec3(1340.11f, 1593.46f, 942.25f))) * 38945.13f);
}

float interpolate3D_cubic( vec3 input_vals ) {
    vec3 input_fract = fract(input_vals);
	vec3 input_floor = floor(input_vals);
	
	// generate the random values associated with the 8 points on our grid
	float bottom_left_front = random3D_to_float_fbm(input_floor);
	float bottom_left_back = random3D_to_float_fbm(input_floor + vec3(0,0,1));
	float bottom_right_front = random3D_to_float_fbm(input_floor + vec3(1,0,0));
	float bottom_right_back = random3D_to_float_fbm(input_floor + vec3(1,0,1));
	float top_left_front = random3D_to_float_fbm(input_floor + vec3(0,1,0));
	float top_left_back = random3D_to_float_fbm(input_floor + vec3(0,1,1));
	float top_right_front = random3D_to_float_fbm(input_floor + vec3(1,1,0));
	float top_right_back = random3D_to_float_fbm(input_floor + vec3(1,1,1));

	float t_x = smoothstep(0.0, 1.0, input_fract.x);
	float t_y = smoothstep(0.0, 1.0, input_fract.y);
	float t_z = smoothstep(0.0, 1.0, input_fract.z);

    float interpX_bottom_front = mix(bottom_left_front, bottom_right_front, t_x);
    float interpX_bottom_back = mix(bottom_left_back, bottom_right_back, t_x);
    float interpX_top_front = mix(top_left_front, top_right_front, t_x);
    float interpX_top_back = mix(top_left_back, top_right_back, t_x);

    float interpY_front = mix(interpX_bottom_front, interpX_top_front, t_y);
    float interpY_bottom = mix(interpX_bottom_back, interpX_top_back, t_y);

    return mix(interpY_front, interpY_bottom, t_z);
}

float fbm3D( vec3 p, float amp, float freq, float persistence, int octaves ) {
    float sum = 0.0;
    for(int i = 0; i < octaves; ++i) {
        sum += interpolate3D_cubic(p * freq) * amp;
        amp *= persistence;
        freq *= 2.0;
    }
    return sum;
}

/////////////////////////////////////////////////////////////////////////////////////////////////


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

vec3 getLavaColor(vec3 p, vec3 n, float shader_time, float freq) {

	// fbm to provide smooth jitter to the worley patterns
	vec3 frag_pos_fbm3D = p.xyz;

	frag_pos_fbm3D.y -= shader_time * 0.25;

	//float noise_val_fbm3D = fbm3D( frag_pos_fbm3D.xyz, 0.4, 1.7, 0.5, 5);
	float noise_val_fbm3D = fbm3D( frag_pos_fbm3D.xyz, u_NoiseAmp[0], u_NoiseFreq[0], u_NoisePersistence[0], int(u_NoiseOctaves[0]));

	// worley to get hot streaks in lava
	vec3 frag_pos_worley3D = p;
	frag_pos_worley3D.y += shader_time + noise_val_fbm3D;

	float noise_val_worley3D = worley3D( frag_pos_worley3D.xyz, u_NoiseFreq[0] );

	//
	// actually getting the lava color
	//

	// temperature -- make lava hotter on top than bottom using bias based on normal
	float temperature = (n.y + 1.0) / 2.0f;	
	float t_worley3D = bias(noise_val_worley3D, temperature);

    vec3 a = vec3(0.2, 0.05, 0.01);
    vec3 a2 = vec3(0.95, 0.84, 0.84);
    float t = t_worley3D;
    t = bias(t, 0.15);
    t = smoothstep(0.0 ,1.0, t);
    a = mix(a,a2, t);
    
    vec3 b = vec3(0.65, 0.35, 0.25);
    vec3 c = vec3(0.29546, 0.457, 0.24);
    vec3 d = vec3(0.65, 0.34233, 0.9788);

    
    return getCosinePaletteColor(a,b,c,d, t_worley3D + 0.4);
}
		
/////////////////////////////////////////////////////////////////////////////////////////////////

void main()
{
	vec3 normal = normalize(fs_Nor.xyz);
	
	float myTime = float(u_Time) / u_Freq[0];

	vec3 diffuseColor = getLavaColor(fs_Pos.xyz, normal, myTime, u_NoiseFreq[0]);

	out_Col = vec4(diffuseColor, 1.0);
}
