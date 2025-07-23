import requests
import os
# import mimetypes # 可以选择性地引入 mimetypes 来动态获取类型
import mimetypes
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse

base_url = "https://langtum.langcore.net/"
upload_endpoint = "/api/file"
file_path = os.path.abspath("./数据录入表.xlsx")
auth_token = "sk-v2c9gcxgkl0s" # 注意：请确保你的 Token 是安全的

upload_url = f"{base_url.rstrip('/')}{upload_endpoint}"

headers = {
    "Authorization": f"Bearer {auth_token}"
    # 注意：当使用 files 参数时，requests 会自动设置 Content-Type 为 multipart/form-data
    # 不需要手动在 headers 中设置 Content-Type: multipart/form-data
}

router = APIRouter()

@router.post("/upload_excel/")
async def upload_excel(file: UploadFile = File(...)):
    """
    接收前端上传的 Excel 文件，转发到远程接口，返回 id 和 url。
    """
    # 文件名判空
    file_name = file.filename or "uploaded.xlsx"
    if not (file_name.endswith('.xlsx') or file_name.endswith('.xls')):
        raise HTTPException(status_code=400, detail="只支持上传Excel文件")

    # 读取文件内容
    file_content = await file.read()
    file_content_type, _ = mimetypes.guess_type(file_name)
    if file_content_type is None:
        file_content_type = 'application/octet-stream'

    files = {
        'file': (file_name, file_content, file_content_type)
    }

    try:
        response = requests.post(upload_url, headers=headers, files=files)
        response.raise_for_status()
        data = response.json()
        # 只返回 fileId 字段（从 data['data']['fileId'] 获取）
        return JSONResponse(content={
            "fileId": data.get("data", {}).get("fileId")
        })
    except Exception as e:
        return JSONResponse(content={
            "success": False,
            "msg": f"上传失败: {str(e)}"
        }, status_code=500)