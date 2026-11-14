import trimesh, numpy as np, os
from trimesh.visual.material import PBRMaterial
S=trimesh.Scene(); G={k:[] for k in ['stone','oak','plank','roof','iron','dark']}
C={'stone':([112,105,92,255],0,.9),'oak':([59,36,22,255],0,.82),'plank':([103,65,38,255],0,.86),'roof':([126,48,35,255],0,.76),'iron':([40,43,45,255],.8,.4),'dark':([31,23,18,255],0,.95)}
def box(m,c,e,a=0):
 q=trimesh.creation.box(extents=e)
 if a:q.apply_transform(trimesh.transformations.rotation_matrix(a,[0,0,1]))
 q.apply_translation(c);G[m].append(q)
def beam(m,a,b,w):
 a=np.array(a,float);b=np.array(b,float);d=b-a
 q=trimesh.creation.box(extents=[w,w,np.linalg.norm(d)])
 z=d/np.linalg.norm(d);u=np.array([0.,1.,0.])
 if abs(z@u)>.98:u=np.array([1.,0.,0.])
 x=np.cross(u,z);x/=np.linalg.norm(x);y=np.cross(z,x);T=np.eye(4);T[:3,:3]=np.column_stack([x,y,z]);T[:3,3]=(a+b)/2;q.apply_transform(T);G[m].append(q)
# broad stone base and timber walls
box('stone',(0,.5,0),(13,1,17))
box('plank',(0,3.9,7.8),(11.7,4.8,.35));box('plank',(-5.8,3.9,0),(.35,4.8,15.6));box('plank',(5.8,3.9,0),(.35,4.8,15.6))
box('plank',(-4.2,3.9,-7.8),(3.2,4.8,.35));box('plank',(4.2,3.9,-7.8),(3.2,4.8,.35))
for x in [-5.6,-2.8,0,2.8,5.6]:
 for z in [-7.5,7.5]:beam('oak',(x,1,z),(x,6.5,z),.36)
for z in [-7.5,-3.75,0,3.75,7.5]:
 for x in [-5.6,5.6]:beam('oak',(x,1,z),(x,6.5,z),.36)
for y in [1.7,5.8,6.4]:
 beam('oak',(-5.8,y,-7.7),(5.8,y,-7.7),.28);beam('oak',(-5.8,y,7.7),(5.8,y,7.7),.28)
# board detail
for x in np.arange(-5.2,5.3,.55):box('oak',(x,4,7.57),(.09,4.45,.07))
for z in np.arange(-7.1,7.2,.55):
 box('oak',(-5.57,4,z),(.07,4.45,.09));box('oak',(5.57,4,z),(.07,4.45,.09))
# stone arched entrance with open central void and segmented arch
for x in [-2.15,2.15]:
 box('stone',(x,3.1,-8.05),(.62,4,.7))
 for y in [1.6,2.4,3.2,4.0]:box('stone',(x,y,-8.45),(.7,.13,.15))
for t in np.linspace(0,np.pi,13):
 x=2.15*np.cos(t);y=5.15+2.15*np.sin(t);box('stone',(x,y,-8.1),(.55,.6,.72),t-np.pi/2)
# double timber doors with iron straps
for side in [-1,1]:
 x=side*1.02;box('oak',(x,3,-7.8),(2,3.6,.18))
 for dx in np.linspace(-.8,.8,6):box('plank',(x+dx,3,-7.68),(.1,3.4,.06))
 for y in [1.8,3,4.2]:box('iron',(x,y,-7.55),(1.9,.1,.08))
# roof trusses and steep roof slopes
beam('oak',(0,9.8,-8.5),(0,9.8,8.5),.38)
for z in [-7.6,-3.8,0,3.8,7.6]:
 beam('oak',(-6.7,6.3,z),(0,9.9,z),.28);beam('oak',(0,9.9,z),(6.7,6.3,z),.28)
theta=np.arctan2(3.6,6.7)
for side in [-1,1]:
 box('dark',(side*3.35,8.1,0),(7.8,.25,17.5),side*theta)
 for row in range(8):
  d=.45+row*.88;x=side*d*np.cos(theta);y=9.9-d*np.sin(theta)
  for col in range(17):
   z=-8.3+col*1.03+(row%2)*.5
   if z<8.4:box('roof',(x,y,z),(.96,.12,1.08),side*theta)
for z in np.arange(-8.2,8.3,1):box('roof',(0,10,z),(.48,.22,.9))
# loft gable framing, side windows and interior stall partitions
for z in [-7.6,7.6]:
 beam('oak',(-5.5,6.5,z),(0,9.7,z),.22);beam('oak',(0,9.7,z),(5.5,6.5,z),.22)
for x in [-5.8,5.8]:
 for z in [-4.5,4.5]:
  box('dark',(x,4.8,z),(.12,.8,1.2))
  for y in [4.55,4.8,5.05]:beam('oak',(x,y,z-.5),(x,y,z+.5),.08)
for z in [-2.6,2.6]:
 box('oak',(0,2.5,z),(10.8,2.6,.16))
 for x in np.arange(-5,5.1,1):beam('plank',(x,1.2,z),(x,3.7,z),.1)
for name,parts in G.items():
 if parts:
  m=trimesh.util.concatenate(parts);col,metal,rough=C[name];m.visual.material=PBRMaterial(name=name,baseColorFactor=col,metallicFactor=metal,roughnessFactor=rough);S.add_geometry(m,node_name='Stable_'+name)
os.makedirs('buildings/stable',exist_ok=True);S.export('buildings/stable/Medieval_Horse_Stable.glb',file_type='glb')
print('Stable GLB generated:',sum(len(m.faces) for m in S.geometry.values()),'triangles')
