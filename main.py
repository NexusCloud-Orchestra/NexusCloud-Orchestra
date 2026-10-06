def main():
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=7575, reload=False, access_log=False)


if __name__ == "__main__":
    main()
