function execute() {
    return Response.success([
        { title: "Phổ biến", input: "sort=0", script: "list.js" },
        { title: "Mới cập nhật", input: "sort=1", script: "list.js" },
        { title: "Nhiều chữ", input: "sort=2", script: "list.js" },
        { title: "Hoàn thành", input: "sort=0&status=0", script: "list.js" }
    ]);
}
