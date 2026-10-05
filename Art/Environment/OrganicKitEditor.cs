using System;
using UnityEngine;
using UnityEditor;
using UnityEditor.SceneManagement;

namespace Prokaryon.OrganicKit.Editor
{
    public static class OrganicKitEditor
    {
        const string Root = "Assets/ProkaryonOrganicKit";

        [MenuItem("Tools/Prokaryon/Organic Kit/Import Art")]
        public static void ImportArt()
        {
            foreach (string guid in AssetDatabase.FindAssets("t:Texture2D", new[] { Root }))
            {
                string path = AssetDatabase.GUIDToAssetPath(guid);
                var t = AssetImporter.GetAtPath(path) as TextureImporter;
                if (t == null) continue;
                t.textureType = TextureImporterType.Sprite;
                t.spriteImportMode = SpriteImportMode.Single;
                t.spritePixelsPerUnit = 64;
                t.filterMode = FilterMode.Point;
                t.mipmapEnabled = false;
                t.textureCompression = TextureImporterCompression.Uncompressed;
                t.wrapMode = TextureWrapMode.Clamp;
                t.alphaSource = TextureImporterAlphaSource.FromInput;
                t.alphaIsTransparency = true;
                t.maxTextureSize = 2048;
                var settings = new TextureImporterSettings();
                t.ReadTextureSettings(settings);
                settings.spriteMeshType = SpriteMeshType.FullRect;
                settings.spriteAlignment = (int)SpriteAlignment.BottomLeft;
                t.SetTextureSettings(settings);
                t.SaveAndReimport();
            }
        }

        static SpriteRenderer AddSprite(string path, string name, Vector3 position, int order, Material material)
        {
            var sprite = AssetDatabase.LoadAssetAtPath<Sprite>(path);
            if (sprite == null) throw new InvalidOperationException("Missing sprite: " + path);
            var go = new GameObject(name, typeof(SpriteRenderer));
            go.transform.position = position;
            var renderer = go.GetComponent<SpriteRenderer>();
            renderer.sprite = sprite;
            renderer.sortingOrder = order;
            if (material != null) renderer.sharedMaterial = material;
            return renderer;
        }

        [MenuItem("Tools/Prokaryon/Organic Kit/Create Raw Channel Demo")]
        public static void Demo()
        {
            if (!EditorSceneManager.SaveCurrentModifiedScenesIfUserWantsTo()) return;
            ImportArt();
            EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            var shader = Shader.Find("Universal Render Pipeline/2D/Sprite-Unlit-Default");
            if (shader == null) shader = Shader.Find("Sprites/Default");
            Material material = AssetDatabase.LoadAssetAtPath<Material>(Root + "/OrganicUnlit.mat");
            if (material == null && shader != null)
            {
                material = new Material(shader);
                AssetDatabase.CreateAsset(material, Root + "/OrganicUnlit.mat");
            }
            for (int y = 0; y < 4; y++)
            for (int x = 0; x < 6; x++)
                AddSprite($"{Root}/Generated/channel/chunk_{x:00}_{y:00}.png", $"Terrain {x},{y}",
                    new Vector3(x*4f, (3-y)*4f, 0f), 0, material);
            AddSprite(Root + "/Generated/channel/fibers.png", "Decorative fibers", Vector3.zero, 1, material);
            var cameraObject = new GameObject("Main Camera", typeof(Camera));
            cameraObject.tag = "MainCamera";
            cameraObject.transform.position = new Vector3(12f,8f,-10f);
            var camera = cameraObject.GetComponent<Camera>();
            camera.orthographic = true;
            camera.orthographicSize = 8.5f;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(25/255f,37/255f,42/255f);
            camera.allowHDR = false;
            camera.allowMSAA = false;
            AssetDatabase.SaveAssets();
            EditorSceneManager.MarkSceneDirty(cameraObject.scene);
            Debug.Log("Raw organic terrain demo created. Save the scene to retain it. No colliders or atmospheric background added.");
        }
    }
}
