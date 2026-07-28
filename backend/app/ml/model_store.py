import os
from typing import Dict
from app.ml.isolation_forest import IFModel

MODEL_DIR = os.getenv("MODEL_DIR", "models")
_loaded_models: Dict[str, IFModel] = {}

def get_model_path(agent_id: str = None) -> str:
    os.makedirs(MODEL_DIR, exist_ok=True)
    if agent_id:
        return os.path.join(MODEL_DIR, f"{agent_id}_if.pkl")
    return os.path.join(MODEL_DIR, "global_if.pkl")

def get_active_model(agent_id: str = None) -> IFModel:
    key = agent_id or "global"
    if key not in _loaded_models:
        path = get_model_path(agent_id)
        if os.path.exists(path):
            _loaded_models[key] = IFModel.load(path)
        else:
            _loaded_models[key] = IFModel()
    return _loaded_models[key]

def set_active_model(model: IFModel, agent_id: str = None):
    key = agent_id or "global"
    _loaded_models[key] = model
    path = get_model_path(agent_id)
    model.save(path)
