class InvalidUsage(Exception):

    def __init__(self, message, status_code):
        super().__init__()
        self.message = message
        self.status_code = status_code