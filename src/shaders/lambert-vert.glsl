#version 300 es

precision highp float;
precision highp int;

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself
			
uniform int u_Time;

uniform vec4 u_Freq;
uniform vec4 u_NoiseFreq;
uniform vec4 u_NoiseAmp;
uniform vec4 u_NoisePersistence;
uniform vec4 u_NoiseOctaves;

uniform vec4 u_LightPos;


in vec4 vs_Pos;             // The array of vertex positions passed to the shader

in vec4 vs_Nor;             // The array of vertex normals passed to the shader

in vec4 vs_Col;             // The array of vertex colors passed to the shader.

out vec4 fs_Pos;			// 
out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.


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
// Procedural Color implementations (Displacement)

// https://iquilezles.org/articles/palettes/
vec3 getCosinePaletteColor(vec3 a, vec3 b, vec3 c, vec3 d, float t) {
    return a + b * cos(2.0 * 3.1415927 * (c * t + d));
}

float getLavaDisplacement(vec3 p, float shader_time, float temperature, float freq) {
	vec3 frag_pos_worley3D = p;

	frag_pos_worley3D.y += shader_time;

	/*frag_pos_worley3D.x += myTime * noise_val_fbm3D;
	frag_pos_worley3D.z += myTime * noise_val_fbm3D;*/
	

	float noise_val_worley3D = worley3D( frag_pos_worley3D.xyz, freq );

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

    
    vec3 lavaColor = getCosinePaletteColor(a,b,c,d, t_worley3D + 0.4);
    return length(lavaColor);
}
		
/////////////////////////////////////////////////////////////////////////////////////////////////


void main()
{

    vec3 normal = normalize(vs_Nor.xyz);

	float myTime = float(u_Time) / u_Freq[0];

    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation

    float temperature = (normal.y + 1.0) / 2.0f;
    float displacement = getLavaDisplacement(vs_Pos.xyz, myTime, temperature, u_NoiseFreq[0]);
	vec3 displacementPos = vs_Pos.xyz + (normal * displacement);
    //vec3 displacementPos = vs_Pos.xyz;
	
	
	
    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.

	


    vec4 modelposition = u_Model * vec4(displacementPos, 1.0);   // Temporarily store the transformed vertex positions for use below

    fs_LightVec = u_LightPos - modelposition;  // Compute the direction in which the light source lies
	
	fs_Pos = modelposition;

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}
