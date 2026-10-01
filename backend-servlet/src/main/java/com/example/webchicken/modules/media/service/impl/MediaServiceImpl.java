package com.example.webchicken.modules.media.service.impl;

import com.example.webchicken.modules.media.dao.MediaDAO;
import com.example.webchicken.modules.media.service.MediaService;
import java.util.Objects;

public class MediaServiceImpl implements MediaService {

    private final MediaDAO mediaDAO;

    public MediaServiceImpl(MediaDAO mediaDAO) {
        this.mediaDAO = Objects.requireNonNull(mediaDAO, "mediaDAO must not be null");
    }

    // TODO: implement methods
}
