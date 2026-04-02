import os

# Just a helper file to easily run the backend by typing "python run.py" instead of the entire command below
# PYTHONPATH=$(pwd) python run.py, mac command to fix the working directory issue

os.system("chainlit run app/ui/chainlit_app.py -w")
